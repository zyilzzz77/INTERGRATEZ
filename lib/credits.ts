import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const GUEST_DEFAULT = 100;

// Top-up packages
export const TOPUP_PACKAGES = [
    { id: "starter", name: "Starter", price: 5000, credits: 7500, days: 30, role: "premium" },
    { id: "basic", name: "Basic", price: 10000, credits: 14500, days: 30, role: "premium" },
    { id: "pro", name: "Pro", price: 20000, credits: 45000, days: 30, role: "premium" },
];

// VIP packages
export const VIP_PACKAGES = [
    { id: "vip-plus", name: "VIP Plus", price: 25000, credits: 0, bonus: 0, days: 30, role: "vip-max" },
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

    // Try to find by exact IP + fingerprint combo
    let record = await prisma.guestCredit.findUnique({
        where: { ip_fingerprint: { ip, fingerprint } },
    });

    if (record) return record;

    // Check if there's a record with the same IP (different browser/fingerprint)
    // This prevents gaming via different browsers on same device
    if (ip !== "unknown") {
        const existingByIp = await prisma.guestCredit.findFirst({
            where: { ip },
            orderBy: { createdAt: "asc" }, // Get the oldest/first record
        });

        if (existingByIp) {
            // Create new record but sync credits with existing IP record
            record = await prisma.guestCredit.create({
                data: { ip, fingerprint, credits: existingByIp.credits },
            });
            return record;
        }
    }

    // Check if there's a record with the same fingerprint (different network/IP)
    // This handles users who changed WiFi / mobile data
    if (fingerprint !== "unknown") {
        const existingByFp = await prisma.guestCredit.findFirst({
            where: { fingerprint },
            orderBy: { createdAt: "asc" },
        });

        if (existingByFp) {
            record = await prisma.guestCredit.create({
                data: { ip, fingerprint, credits: existingByFp.credits },
            });
            return record;
        }
    }

    // Brand new device — give default credits
    record = await prisma.guestCredit.create({
        data: { ip, fingerprint, credits: GUEST_DEFAULT },
    });
    return record;
}

/**
 * Get credit info for the current user (authenticated or guest)
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
            select: { credits: true, bonusCredits: true, creditsExpiry: true, role: true },
        });

        if (user) {
            // Check if credits have expired
            if (user.creditsExpiry && new Date() > user.creditsExpiry) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: 100, creditsExpiry: null, role: "free" },
                });
                return {
                    credits: 100,
                    bonusCredits: 0,
                    isGuest: false,
                    userId: session.user.id,
                    creditsExpiry: null,
                    role: "free",
                };
            }

            return {
                credits: user.credits,
                bonusCredits: user.bonusCredits,
                isGuest: false,
                userId: session.user.id,
                creditsExpiry: user.creditsExpiry,
                role: user.role,
            };
        }
    }

    // Guest user — use IP + fingerprint from DB
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const fingerprint = getFingerprint(headersList);

    const guestRecord = await getOrCreateGuestCredit(ip, fingerprint);

    return {
        credits: guestRecord.credits,
        isGuest: true,
    };
}

/**
 * Deduct 1 credit from the current user
 * Returns false if no credits remaining
 * Accepts an action param to allow unlimited streaming/download for VIP roles
 */
export async function deductCredit(action: string = "download"): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try {
        session = await auth();
    } catch {
        // Treat as guest if auth fails
    }

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, bonusCredits: true, creditsExpiry: true, role: true },
        });

        if (!user) return false;

        // Ensure user obj is mutable locally
        let currentCredits = user.credits;
        let currentBonus = user.bonusCredits;
        let currentRole = user.role;
        let currentExpiry = user.creditsExpiry;

        // Check VIP expiry completely first:
        if (currentExpiry && new Date() > currentExpiry) {
            // For those with unlimited/active bonus, when VIP expires, move bonus to credits
            if (currentBonus > 0) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: currentBonus, bonusCredits: 0, creditsExpiry: null, role: "free" },
                });
                currentCredits = currentBonus;
                currentBonus = 0;
                currentRole = "free";
                currentExpiry = null;
            } else {
                // If they expire and have no bonus, give them 100 free credits as standard
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: 100, creditsExpiry: null, role: "free" },
                });
                currentCredits = 100;
                currentRole = "free";
                currentExpiry = null;
            }
        }

        // Check credit depletion and rollover
        if (currentCredits <= 0 && currentBonus > 0) {
            // They ran out of normal credits but have bonus!
            // According to logic, only 50k unlimitid waits for expiry, other bonuses are used immediately when 0
            if (currentRole !== "vip-max") { // vip-max MUST wait for expiry as per instructions
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: currentBonus, bonusCredits: 0 },
                });
                currentCredits = currentBonus;
                currentBonus = 0;
            }
        }

        // VIP features tracking (Streaming & Downloads) after rollovers applied
        if (action === "streaming" && (currentRole === "vip" || currentRole === "vip-max")) {
            await prisma.requestLog.create({
                data: { userId: session.user.id, action: "streaming-vip" },
            }).catch(() => { });
            return true;
        }

        if (currentRole === "vip-max") {
            await prisma.requestLog.create({
                data: { userId: session.user.id, action: `vip-max-${action}` },
            }).catch(() => { });
            return true;
        }

        // If they still don't have credits, deny
        if (currentCredits <= 0) return false;

        // Standard Deduction
        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: 1 } },
        });

        await prisma.requestLog.create({
            data: { userId: session.user.id, action },
        }).catch(() => { });
        return true;
    }

    // Guest user — deduct from DB based on IP + fingerprint
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const fingerprint = getFingerprint(headersList);

    const guestRecord = await getOrCreateGuestCredit(ip, fingerprint);

    if (guestRecord.credits <= 0) return false;

    // Deduct from all records with the same IP OR fingerprint (keep them in sync)
    await prisma.guestCredit.updateMany({
        where: {
            OR: [
                { ip },
                ...(fingerprint !== "unknown" ? [{ fingerprint }] : []),
            ],
        },
        data: { credits: { decrement: 1 } },
    });

    return true;
}
