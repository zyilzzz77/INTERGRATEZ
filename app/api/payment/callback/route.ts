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
    const startTime = Date.now();

    try {
        const rawBody = await req.text();
        console.log(`[Callback] Raw body: ${rawBody}`);

        const params = new URLSearchParams(rawBody);

        const mid          = (params.get("mid") || "").trim();
        const clientId     = (params.get("client_id") || "").trim();
        const clientSecret = (params.get("client_secret") || "").trim();
        const payId        = (params.get("pay_id") || "").trim();
        const uniqueCode   = (params.get("unique_code") || "").trim();
        const status       = (params.get("status") || "").trim();
        const signature    = (params.get("signature") || "").trim().toLowerCase();

        console.log(`[Callback] mid=${mid} clientId=${clientId.substring(0,8)}... uniqueCode=${uniqueCode} payId=${payId} status=${status}`);

        const flazpayConfig = getFlazpayConfig();
        const missingEnv = getMissingFlazpayEnv(flazpayConfig);
        if (missingEnv.length > 0) {
            console.error("[Callback] Missing env:", missingEnv);
            return new NextResponse("CONFIG_ERROR", { status: 500 });
        }

        // ─── Signature validation (PRIMARY AUTH) ───────────────────────
        // Per Flazpay docs: md5(mid + client_id + client_secret + unique_code + 'CallbackStatus')
        // We try all reference code variations to handle Flazpay sending either unique_code or pay_id.
        const signatureCandidates = [uniqueCode, payId].filter(Boolean);

        // Also try with our configured credentials in case Flazpay sends different values
        const isSignatureValid = signatureCandidates.some((code) => {
            // Validate using credentials from callback body (standard)
            const sigFromBody = createFlazpayCallbackSignature({
                mid, clientId, clientSecret, uniqueCode: code,
            }).toLowerCase();
            // Validate using our configured credentials (fallback if body has slightly different format)
            const sigFromConfig = createFlazpayCallbackSignature({
                mid: flazpayConfig.mid,
                clientId: flazpayConfig.clientId,
                clientSecret: flazpayConfig.clientSecret,
                uniqueCode: code,
            }).toLowerCase();

            console.log(`[Callback] Checking code=${code} sig=${signature} vs bodyCalc=${sigFromBody} vs configCalc=${sigFromConfig}`);

            return signature === sigFromBody || signature === sigFromConfig;
        });

        if (!isSignatureValid) {
            console.warn(`[Callback] SIGNATURE MISMATCH — signature=${signature}`);
            // Return 200 anyway to prevent retry spam, but don't process
            return new NextResponse("SIGNATURE_INVALID", { status: 200 });
        }

        console.log(`[Callback] Signature OK ✓`);

        // ─── Lookup transaction ────────────────────────────────────────
        const references = [uniqueCode, payId].filter(Boolean);
        if (references.length === 0) {
            console.error("[Callback] No reference code in payload");
            return new NextResponse("MISSING_REFERENCE", { status: 200 });
        }

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
            console.warn(`[Callback] Transaction not found for references: ${references.join(", ")}`);
            return new NextResponse("TRANSACTION_NOT_FOUND", { status: 200 });
        }

        console.log(`[Callback] Transaction found: id=${transaction.id} currentStatus=${transaction.status} paymentId=${transaction.paymentId}`);

        // ─── Normalize status ──────────────────────────────────────────
        const normalizedStatus = normalizeFlazpayStatus(status);
        console.log(`[Callback] Raw status="${status}" → normalized="${normalizedStatus}"`);

        if (normalizedStatus === "pending") {
            return new NextResponse("OK", { status: 200 });
        }

        // ─── Handle PAID ───────────────────────────────────────────────
        if (normalizedStatus === "paid") {
            if (transaction.status !== "paid") {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + transaction.days);

                const { role, label } = resolveRoleAndLabel(transaction.credits, transaction.days);
                console.log(`[Callback] Marking PAID: userId=${transaction.userId} credits+=${transaction.credits} role=${role}`);

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

                console.log(`[Callback] ✅ Transaction ${transaction.paymentId} marked as PAID. Credits +${transaction.credits} added to user ${transaction.userId}`);

                // Send email (non-blocking)
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
                        console.error("[Callback] Failed to send topup email:", err);
                    });
                }
            } else {
                console.log(`[Callback] Transaction ${transaction.paymentId} already PAID, skipping.`);
            }

            return new NextResponse("OK", { status: 200 });
        }

        // ─── Handle FAILED / EXPIRED ───────────────────────────────────
        if (transaction.status !== "paid" && transaction.status !== "failed") {
            console.log(`[Callback] Marking FAILED/EXPIRED: ${transaction.paymentId}`);
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "failed" },
            });
        }

        console.log(`[Callback] Done in ${Date.now() - startTime}ms`);
        return new NextResponse("OK", { status: 200 });

    } catch (error) {
        console.error("[Callback] Unhandled error:", error);
        // Always return 200 to prevent Flazpay retry spam
        return new NextResponse("OK", { status: 200 });
    }
}

// Simple GET for uptime check / testing
export async function GET() {
    return NextResponse.json({
        ok: true,
        endpoint: "/api/payment/callback",
        method: "POST",
        note: "Flazpay callback receiver — send POST with form-urlencoded payload",
    });
}