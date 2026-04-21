import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const GUEST_DEFAULT = 100;

// Top-up packages
export const TOPUP_PACKAGES: Array<{ id: string; name: string; price: number; credits: number; days: number; role: string }> = [];

// VIP packages
export const VIP_PACKAGES = [
    { id: "vip-7", name: "VIP 7 Hari", price: 7500, credits: 0, bonus: 0, days: 7, role: "vip-max" },
    { id: "vip-14", name: "VIP 14 Hari", price: 14000, credits: 0, bonus: 0, days: 14, role: "vip-max" },
    { id: "vip-30", name: "VIP 30 Hari", price: 25000, credits: 0, bonus: 0, days: 30, role: "vip-max" },
];

export interface CreditInfo {
    credits: number;
    bonusCredits?: number;
    isGuest: boolean;
    userId?: string;
    creditsExpiry?: Date | null;
    role?: string;
}

/**
 * Extract client IP from request headers (clean IPv4 is set by middleware)
 */
function getClientIp(headersList: Headers): string {
    // Middleware now guarantees x-real-ip is a clean IPv4 string
    const ip = headersList.get("x-real-ip");
    return ip || "127.0.0.1";
}

/**
 * Extract fingerprint from request headers (set by middleware from cookie)
 */
function getFingerprint(headersList: Headers): string {
    return headersList.get("x-fingerprint") || "unknown";
}

/**
 * Get or create guest credit record based on IP + fingerprint
 */
async function getOrCreateGuestCredit(ip: string, fingerprint: string) {
    // If both are unknown, we can't track — fallback to 0 credits to force login
    if (ip === "unknown" && fingerprint === "unknown") {
        return { credits: 0 };
    }

    try {
        // Try to find by exact IP + fingerprint combo
        let record = await prisma.guestCredit.findUnique({
            where: { ip_fingerprint: { ip, fingerprint } },
        });

        if (record) return record;

        let creditsToAssign = GUEST_DEFAULT;

        // Check if there's a record with the same IP (different browser/fingerprint)
        // This prevents gaming via different browsers on same device
        if (ip !== "unknown") {
            const existingByIp = await prisma.guestCredit.findFirst({
                where: { ip },
                orderBy: { createdAt: "asc" }, // Get the oldest/first record
            });

            if (existingByIp) {
                creditsToAssign = existingByIp.credits;
            }
        }

        // Check if there's a record with the same fingerprint (different network/IP)
        // This handles users who changed WiFi / mobile data
        if (creditsToAssign === GUEST_DEFAULT && fingerprint !== "unknown") {
            const existingByFp = await prisma.guestCredit.findFirst({
                where: { fingerprint },
                orderBy: { createdAt: "asc" },
            });

            if (existingByFp) {
                creditsToAssign = existingByFp.credits;
            }
        }

        try {
            // Use upsert to handle concurrent creation attempts cleanly
            record = await prisma.guestCredit.upsert({
                where: { ip_fingerprint: { ip, fingerprint } },
                update: {}, // do not modify if it was just created by another request
                create: { ip, fingerprint, credits: creditsToAssign },
            });
        } catch (e) {
            // Fallback in case of extreme race conditions or locking issues
            record = await prisma.guestCredit.findUnique({
                where: { ip_fingerprint: { ip, fingerprint } },
            });

            if (!record) {
                throw e; // Reraise if still not found
            }
        }

        return record;
    } catch (error) {
        console.error("[Credits] Guest credit fallback activated:", error);
        return { credits: GUEST_DEFAULT };
    }
}

/**
 * Get role info for the current user (authenticated or guest)
 */
export async function getCreditInfo(): Promise<CreditInfo> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try {
        session = await auth();
    } catch {
        // auth() can fail with JSON parse errors if session cookie is malformed
        // Treat as guest in this case
    }

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { creditsExpiry: true, role: true },
        });

        if (user) {
            // Check if VIP expired
            if (user.creditsExpiry && new Date() > user.creditsExpiry) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { role: "free", creditsExpiry: null },
                });
                return {
                    credits: 0,
                    isGuest: false,
                    userId: session.user.id,
                    creditsExpiry: null,
                    role: "free",
                };
            }

            return {
                credits: 0,
                isGuest: false,
                userId: session.user.id,
                creditsExpiry: user.creditsExpiry,
                role: user.role,
            };
        }
    }

    return {
        credits: 0,
        isGuest: true,
        role: "free"
    };
}

/**
 * Check if user has access to a specific action.
 * Replaces old credit deduction logic.
 * - Drama/Streaming requires VIP
 * - Other tools are unlimited
 */
export async function deductCredit(action: string = "download"): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try {
        session = await auth();
    } catch {
        // Treat as guest if auth fails
    }

    const isDramaAction = action === "streaming" || action.includes("drama");

    if (session?.user?.id) {
        let user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { creditsExpiry: true, role: true },
        });

        if (!user) return !isDramaAction; // Guest without DB record can use free tools

        let currentRole = user.role;
        let currentExpiry = user.creditsExpiry;

        // Check VIP expiry
        if (currentExpiry && new Date() > currentExpiry) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { role: "free", creditsExpiry: null },
            });
            currentRole = "free";
            currentExpiry = null;
        }

        const isVip = currentRole === "vip" || currentRole === "vip-max" || currentRole === "admin";

        // Log actions for analytics (optional but good)
        await prisma.requestLog.create({
            data: { userId: session.user.id, action: `${isVip ? 'vip' : 'free'}-${action}` },
        }).catch(() => { });

        if (isDramaAction) {
            return isVip;
        }

        // Unlimited tool access for logged in users
        return true;
    }

    // Guest user logic
    if (isDramaAction) {
        return false; // Guests cannot watch drama
    }

    // Guests can use free tools unlimited as well (or we could limit them if needed, but user said remove credits)
    return true;
}
