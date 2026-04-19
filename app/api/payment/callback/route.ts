import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTopupSuccessEmail } from "@/lib/mail";
import { TOPUP_PACKAGES, VIP_PACKAGES } from "@/lib/credits";
import {
    createFlazpayCallbackSignature,
    getFlazpayConfig,
    getMissingFlazpayEnv,
    normalizeFlazpayStatus,
} from "@/lib/flazpay";

function resolveRoleAndLabel(credits: number, days: number) {
    const matchingPkg = [...TOPUP_PACKAGES, ...VIP_PACKAGES].find(
        (pkg) => pkg.credits === credits && pkg.days === days
    );

    return {
        role: matchingPkg?.role || "premium",
        label: matchingPkg?.name || `${credits} Koin (${days} Hari)`,
    };
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const params = new URLSearchParams(rawBody);

        const mid = (params.get("mid") || "").trim();
        const clientId = (params.get("client_id") || "").trim();
        const clientSecret = (params.get("client_secret") || "").trim();
        const payId = (params.get("pay_id") || "").trim();
        const uniqueCode = (params.get("unique_code") || "").trim();
        const status = (params.get("status") || "").trim();
        const signature = (params.get("signature") || "").trim().toLowerCase();

        const flazpayConfig = getFlazpayConfig();
        const missingEnv = getMissingFlazpayEnv(flazpayConfig);
        if (missingEnv.length > 0) {
            console.error("[Flazpay Callback] Missing env:", missingEnv);
            return new NextResponse("CONFIG_ERROR", { status: 500 });
        }

        if (
            mid !== flazpayConfig.mid ||
            clientId !== flazpayConfig.clientId ||
            clientSecret !== flazpayConfig.clientSecret
        ) {
            return new NextResponse("INVALID_MERCHANT", { status: 403 });
        }

        const signatureCode = uniqueCode || payId;
        if (!signatureCode) {
            return new NextResponse("MISSING_REFERENCE", { status: 400 });
        }

        const expectedSignature = createFlazpayCallbackSignature({
            mid,
            clientId,
            clientSecret,
            uniqueCode: signatureCode,
        }).toLowerCase();

        const fallbackPayIdSignature = payId
            ? createFlazpayCallbackSignature({
                mid,
                clientId,
                clientSecret,
                uniqueCode: payId,
            }).toLowerCase()
            : "";

        if (signature !== expectedSignature && signature !== fallbackPayIdSignature) {
            return new NextResponse("INVALID_SIGNATURE", { status: 403 });
        }

        const references = [uniqueCode, payId].filter(Boolean);
        const transaction = await prisma.transaction.findFirst({
            where: {
                paymentId: { in: references },
            },
            select: {
                id: true,
                userId: true,
                paymentId: true,
                amount: true,
                credits: true,
                bonusCredits: true,
                days: true,
                status: true,
            },
        });

        if (!transaction) {
            return new NextResponse("TRANSACTION_NOT_FOUND", { status: 404 });
        }

        const normalizedStatus = normalizeFlazpayStatus(status);
        if (normalizedStatus === "unknown") {
            return new NextResponse("UNKNOWN_STATUS", { status: 400 });
        }

        if (normalizedStatus === "pending") {
            return new NextResponse("OK", { status: 200 });
        }

        if (normalizedStatus === "paid") {
            if (transaction.status !== "paid") {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + transaction.days);

                const { role, label } = resolveRoleAndLabel(transaction.credits, transaction.days);

                await prisma.$transaction([
                    prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { status: "paid" },
                    }),
                    prisma.user.update({
                        where: { id: transaction.userId },
                        data: {
                            credits: { increment: transaction.credits },
                            bonusCredits: { increment: transaction.bonusCredits },
                            creditsExpiry: expiryDate,
                            role,
                        },
                    }),
                ]);

                const user = await prisma.user.findUnique({
                    where: { id: transaction.userId },
                    select: { email: true, name: true },
                });

                if (user?.email && user?.name) {
                    sendTopupSuccessEmail(
                        user.email,
                        user.name,
                        label,
                        transaction.amount,
                        transaction.credits
                    ).catch((err) => {
                        console.error("[Flazpay Callback] Failed to send topup email:", err);
                    });
                }
            }

            return new NextResponse("OK", { status: 200 });
        }

        if (transaction.status !== "paid" && transaction.status !== "failed") {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "failed" },
            });
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("[Flazpay Callback] Error:", error);
        return new NextResponse("ERROR", { status: 500 });
    }
}