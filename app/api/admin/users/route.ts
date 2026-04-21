import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
    const session = await verifyAdminSession();
    if (!session) return null;
    if (session.role !== "admin") return null;
    return session;
}

// GET /api/admin/users?page=1&search=&role=
export async function GET(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const where = {
        AND: [
            search ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ]
            } : {},
            role ? { role } : {},
        ],
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                credits: true,
                bonusCredits: true,
                creditsExpiry: true,
                createdAt: true,
                accountId: true,
                image: true,
                _count: { select: { transactions: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

// PATCH /api/admin/users — update user credits/role
export async function PATCH(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, credits, bonusCredits, role, days } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (action === "add_credits") {
        // Add credits + optional VIP days
        const updateData: Record<string, unknown> = {};
        if (credits && credits > 0) updateData.credits = { increment: credits };
        if (bonusCredits && bonusCredits > 0) updateData.bonusCredits = { increment: bonusCredits };
        if (role) updateData.role = role;
        if (days && days > 0) {
            const expiry = new Date();
            // Extend from current expiry if still active, else from now
            const base = user.creditsExpiry && user.creditsExpiry > new Date() ? user.creditsExpiry : new Date();
            base.setDate(base.getDate() + days);
            updateData.creditsExpiry = base;
        }

        const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
        return NextResponse.json({ success: true, user: updated });
    }

    if (action === "set_role") {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        return NextResponse.json({ success: true, user: updated });
    }

    if (action === "reset_credits") {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { credits: 100, bonusCredits: 0, creditsExpiry: null, role: "free" },
        });
        return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
