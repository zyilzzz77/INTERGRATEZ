import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Sync guest credits to user account after login.
 * If user is new (still has default 100 credits, role "free"),
 * their credits are set to match the guest credits.
 * This prevents credit reset when logging in.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Middleware guarantees x-real-ip is a clean IPv4 string
        const ip = req.headers.get("x-real-ip") || "127.0.0.1";
        const fingerprint = req.headers.get("x-fingerprint") || "unknown";

        if (ip === "127.0.0.1" && fingerprint === "unknown") {
            return NextResponse.json({ synced: false, reason: "no_device_info" });
        }

        // Find guest credit record for this device
        let guestRecord = await prisma.guestCredit.findUnique({
            where: { ip_fingerprint: { ip, fingerprint } },
        });

        // Also check by IP only if exact combo not found
        if (!guestRecord && ip !== "127.0.0.1") {
            guestRecord = await prisma.guestCredit.findFirst({
                where: { ip },
                orderBy: { createdAt: "asc" },
            });
        }

        // Also check by fingerprint only (user may have changed network)
        if (!guestRecord && fingerprint !== "unknown") {
            guestRecord = await prisma.guestCredit.findFirst({
                where: { fingerprint },
                orderBy: { createdAt: "asc" },
            });
        }

        if (!guestRecord) {
            return NextResponse.json({ synced: false, reason: "no_guest_record" });
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, role: true, creditsExpiry: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only sync if user is "free" and hasn't topped up
        // (has default 100 credits and no expiry = never purchased)
        const isNewFreeUser = user.role === "free" && !user.creditsExpiry;

        if (isNewFreeUser) {
            // BUG FIX: Take the maximum of guest credits and default 100.
            // This prevents overwriting the user's default 100 credits with 0
            // when a guest who used all their credits logs in.
            const FREE_DEFAULT = 100;
            const finalCredits = Math.max(guestRecord.credits, FREE_DEFAULT);

            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: finalCredits },
            });

            console.log(`[sync-credits] Synced user ${session.user.id}: ${finalCredits} credits (guest: ${guestRecord.credits}, default: ${FREE_DEFAULT}, IP: ${ip})`);

            return NextResponse.json({
                synced: true,
                credits: finalCredits,
            });
        }

        // User has topped up or has custom credits — don't override
        return NextResponse.json({
            synced: false,
            reason: "user_has_purchased_credits",
            credits: user.credits,
        });
    } catch (error) {
        console.error("[sync-credits] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
