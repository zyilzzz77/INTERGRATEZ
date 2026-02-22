import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the last 7 days
        const now = new Date();
        const days: { label: string; count: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            let count = 0;
            try {
                count = await prisma.requestLog.count({
                    where: {
                        userId: session.user.id,
                        createdAt: { gte: dayStart, lte: dayEnd },
                    },
                });
            } catch {
                // Table might not exist yet
                count = 0;
            }

            const label = dayStart.toLocaleDateString("en", { weekday: "short" });
            days.push({ label, count });
        }

        return NextResponse.json({ days });
    } catch {
        return NextResponse.json({ days: [] }, { status: 500 });
    }
}
