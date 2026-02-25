import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCreditExpiryWarningEmail } from "@/lib/mail";

// Secure this endpoint so it can't be spammed publicly
const CRON_SECRET = process.env.CRON_SECRET || "inversave-cron-key-123";

export async function GET(request: Request) {
    try {
        // Authenticate the cron request
        const url = new URL(request.url);
        const authHeader = request.headers.get("authorization");
        const authQuery = url.searchParams.get("key");

        if (
            authHeader !== `Bearer ${CRON_SECRET}` &&
            authQuery !== CRON_SECRET
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        // Find users whose credits expire between now and 3 days from now
        // And ensure they aren't "free" role just in case
        const usersToWarn = await prisma.user.findMany({
            where: {
                role: "premium",
                creditsExpiry: {
                    gte: now,
                    lte: threeDaysFromNow
                }
            },
            select: { id: true, name: true, email: true, creditsExpiry: true }
        });

        const sentTo: string[] = [];

        for (const user of usersToWarn) {
            if (user.email && user.name && user.creditsExpiry) {
                // Calculate precise remaining days
                const diffTime = Math.abs(user.creditsExpiry.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                await sendCreditExpiryWarningEmail(user.email, user.name, diffDays);
                sentTo.push(user.email);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Checked expiry. Sent warnings to ${sentTo.length} users.`,
            notifiedUsers: sentTo
        });

    } catch (error) {
        console.error("Cron check expiry error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
