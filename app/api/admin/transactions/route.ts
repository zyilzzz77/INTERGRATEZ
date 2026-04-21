import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
    const session = await verifyAdminSession();
    if (!session) return null;
    const u = session.user as typeof session.user & { role?: string };
    if (u.role !== "admin") return null;
    return session;
}

// GET /api/admin/transactions?page=1&status=&userId=
export async function GET(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const status = searchParams.get("status") || "";
    const userId = searchParams.get("userId") || "";

    const where = {
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
    };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true, accountId: true } },
            },
        }),
        prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
