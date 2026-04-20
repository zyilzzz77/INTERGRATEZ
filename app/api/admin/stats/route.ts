import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
    const session = await auth();
    if (!session?.user) return null;
    const u = session.user as typeof session.user & { role?: string };
    if (u.role !== "admin") return null;
    return session;
}

// GET /api/admin/stats
export async function GET() {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
        totalUsers,
        totalTransactions,
        paidTransactions,
        pendingTransactions,
        revenueResult,
        newUsersToday,
        recentTransactions,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.transaction.count({ where: { status: "paid" } }),
        prisma.transaction.count({ where: { status: "pending" } }),
        prisma.transaction.aggregate({
            where: { status: "paid" },
            _sum: { amount: true },
        }),
        prisma.user.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
        prisma.transaction.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            where: { status: "paid" },
            include: { user: { select: { name: true, email: true } } },
        }),
    ]);

    // Role distribution
    const roleGroups = await prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
    });

    return NextResponse.json({
        totalUsers,
        totalTransactions,
        paidTransactions,
        pendingTransactions,
        totalRevenue: revenueResult._sum.amount || 0,
        newUsersToday,
        recentTransactions,
        roleDistribution: roleGroups.map((r) => ({ role: r.role, count: r._count.id })),
    });
}
