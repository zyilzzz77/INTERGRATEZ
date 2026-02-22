import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const GUEST_COOKIE = "guest_credits";
const GUEST_DEFAULT = 100;

// Top-up packages
export const TOPUP_PACKAGES = [
    { id: "starter", name: "Starter", price: 5000, credits: 1500, days: 14 },
    { id: "basic", name: "Basic", price: 10000, credits: 3000, days: 14 },
    { id: "pro", name: "Pro", price: 25000, credits: 7500, days: 14 },
    { id: "premium", name: "Premium", price: 50000, credits: 15000, days: 14 },
];

export interface CreditInfo {
    credits: number;
    isGuest: boolean;
    userId?: string;
    creditsExpiry?: Date | null;
    role?: string;
}

/**
 * Get credit info for the current user (authenticated or guest)
 */
export async function getCreditInfo(): Promise<CreditInfo> {
    const session = await auth();

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, creditsExpiry: true, role: true },
        });

        if (user) {
            // Check if credits have expired
            if (user.creditsExpiry && new Date() > user.creditsExpiry) {
                // Credits expired, reset to 0 for purchased credits
                // but keep the base 100 free credits
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { credits: 100, creditsExpiry: null, role: "free" },
                });
                return {
                    credits: 100,
                    isGuest: false,
                    userId: session.user.id,
                    creditsExpiry: null,
                    role: "free",
                };
            }

            return {
                credits: user.credits,
                isGuest: false,
                userId: session.user.id,
                creditsExpiry: user.creditsExpiry,
                role: user.role,
            };
        }
    }

    // Guest user - use cookie
    const cookieStore = await cookies();
    const guestCredits = cookieStore.get(GUEST_COOKIE);
    const credits = guestCredits ? parseInt(guestCredits.value, 10) : GUEST_DEFAULT;

    return {
        credits: isNaN(credits) ? GUEST_DEFAULT : credits,
        isGuest: true,
    };
}

/**
 * Deduct 1 credit from the current user
 * Returns false if no credits remaining
 */
export async function deductCredit(): Promise<boolean> {
    const session = await auth();

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, creditsExpiry: true },
        });

        if (!user || user.credits <= 0) return false;

        // Check expiry
        if (user.creditsExpiry && new Date() > user.creditsExpiry) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: 100, creditsExpiry: null, role: "free" },
            });
            // Still deduct from the reset 100
            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: 1 } },
            });
            // Log usage
            await prisma.requestLog.create({
                data: { userId: session.user.id, action: "download" },
            }).catch(() => { }); // Silent fail if table doesn't exist yet
            return true;
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: 1 } },
        });
        // Log usage
        await prisma.requestLog.create({
            data: { userId: session.user.id, action: "download" },
        }).catch(() => { }); // Silent fail if table doesn't exist yet
        return true;
    }

    // Guest user
    const cookieStore = await cookies();
    const guestCredits = cookieStore.get(GUEST_COOKIE);
    const credits = guestCredits ? parseInt(guestCredits.value, 10) : GUEST_DEFAULT;
    const current = isNaN(credits) ? GUEST_DEFAULT : credits;

    if (current <= 0) return false;

    cookieStore.set(GUEST_COOKIE, String(current - 1), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
    });

    return true;
}
