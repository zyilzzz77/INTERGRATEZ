import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIP_PACKAGES } from "@/lib/credits";
import {
    createFlazpayNewSignature,
    createMerchantUniqueCode,
    getFlazpayConfig,
    getMissingFlazpayEnv,
    mapFlazpayCreateErrorMessage,
} from "@/lib/flazpay";
import { getFlazpayChannelById, validateAmountByChannel } from "@/lib/flazpayChannels";

function buildReturnUrl(req: NextRequest, configuredUrl: string): string {
    if (configuredUrl) return configuredUrl;
    return `${req.nextUrl.origin}/topup`;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Silakan login terlebih dahulu untuk top up" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { packageId, phoneNumber, serviceId } = body;

        if (!packageId || typeof packageId !== "string") {
            return NextResponse.json({ error: "Silakan pilih paket VIP terlebih dahulu." }, { status: 400 });
        }

        const pkg = VIP_PACKAGES.find((item) => item.id === packageId);
        if (!pkg) {
            return NextResponse.json({ error: "Paket VIP tidak valid." }, { status: 400 });
        }

        const baseAmount = pkg.price;
        const creditsToGive = pkg.credits;
        const bonusToGive = pkg.bonus ?? 0;
        const activeDays = pkg.days;
        const packageName = pkg.name;

        // Add app fee 2.5% for every payment channel
        const APP_FEE_PERCENT = 2.5;
        const appFee = Math.ceil(baseAmount * APP_FEE_PERCENT / 100);
        const totalAmount = baseAmount + appFee;

        const flazpayConfig = getFlazpayConfig();
        const missingEnv = getMissingFlazpayEnv(flazpayConfig);
        if (missingEnv.length > 0) {
            return NextResponse.json(
                { error: `Konfigurasi Flazpay belum lengkap: ${missingEnv.join(", ")}` },
                { status: 500 }
            );
        }

        const incomingServiceId =
            typeof serviceId === "number"
                ? String(serviceId)
                : typeof serviceId === "string"
                    ? serviceId.trim()
                    : "";
        const selectedService = incomingServiceId || flazpayConfig.service;

        const selectedChannel = getFlazpayChannelById(selectedService);
        if (!selectedChannel) {
            return NextResponse.json({ error: "Channel pembayaran tidak valid." }, { status: 400 });
        }

        const channelAmountValidation = validateAmountByChannel(totalAmount, selectedChannel);
        if (!channelAmountValidation.ok) {
            return NextResponse.json({ error: channelAmountValidation.message }, { status: 400 });
        }

        const merchantUniqueCode = createMerchantUniqueCode("INV");
        const note = `${packageName} - Unlimited Request`;

        type FlazpayCreateApiResponse = {
            status?: boolean;
            msg?: string;
            message?: string;
            data?: unknown;
        };

        const signatureParams = {
            mid: flazpayConfig.mid,
            clientId: flazpayConfig.clientId,
            clientSecret: flazpayConfig.clientSecret,
            uniqueCode: merchantUniqueCode,
            service: selectedService,
            amount: totalAmount,
        };

        const primarySignature = createFlazpayNewSignature(signatureParams, "client-first");
        const fallbackSignature = createFlazpayNewSignature(signatureParams, "mid-first");

        const sendCreateRequest = async (signature: string) => {
            const payload = new URLSearchParams({
                mid: flazpayConfig.mid,
                client_id: flazpayConfig.clientId,
                client_secret: flazpayConfig.clientSecret,
                action: "new",
                unique_code: merchantUniqueCode,
                service: selectedService,
                type_fee: flazpayConfig.typeFee,
                amount: String(totalAmount),
                note,
                return_url: buildReturnUrl(req, flazpayConfig.returnUrl),
                signature,
            });

            if (phoneNumber && typeof phoneNumber === "string") {
                payload.set("phone_number", phoneNumber.trim());
            }

            const response = await fetch(flazpayConfig.createEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: payload.toString(),
                cache: "no-store",
            });

            if (!response.ok) {
                return {
                    kind: "http-error" as const,
                    status: response.status,
                };
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await response.text();
                return {
                    kind: "non-json" as const,
                    text,
                };
            }

            const data = (await response.json()) as FlazpayCreateApiResponse;
            return {
                kind: "json" as const,
                data,
            };
        };

        let requestResult = await sendCreateRequest(primarySignature);

        if (requestResult.kind === "json") {
            const responseMessage = String(
                requestResult.data.msg || requestResult.data.message || ""
            ).toLowerCase();
            const shouldRetryWithFallback =
                (!requestResult.data.status || !requestResult.data.data) &&
                (responseMessage.includes("autentikasi") || responseMessage.includes("signature"));

            if (shouldRetryWithFallback && fallbackSignature !== primarySignature) {
                requestResult = await sendCreateRequest(fallbackSignature);
            }
        }

        if (requestResult.kind === "http-error") {
            console.error(`Flazpay API returned status ${requestResult.status}`);
            return NextResponse.json(
                { error: `Layanan pembayaran sedang gangguan (HTTP ${requestResult.status}). Coba lagi nanti.` },
                { status: 502 }
            );
        }

        if (requestResult.kind === "non-json") {
            console.error("Flazpay API returned non-JSON:", requestResult.text.substring(0, 200));
            return NextResponse.json(
                { error: "Layanan pembayaran sedang tidak tersedia. Coba lagi nanti." },
                { status: 502 }
            );
        }

        const data = requestResult.data;

        if (!data.status || !data.data) {
            const gatewayMessage = String(data.msg || data.message || "");
            return NextResponse.json(
                { error: mapFlazpayCreateErrorMessage(gatewayMessage) },
                { status: 500 }
            );
        }

        const gatewayData = data.data as {
            pay_id?: string;
            unique_code?: string;
            amount?: number | string;
            redirect_url?: string;
            checkout_url?: string;
            qrcode_url?: string;
            qr_content?: string;
            va_number?: string;
            virtual_account?: string;
            payment_no?: string;
            pay_no?: string;
            expired_at?: string;
        };

        const paymentId = String(
            gatewayData.unique_code || gatewayData.pay_id || merchantUniqueCode
        );
        const amountFromGateway = Number(gatewayData.amount);
        const finalAmount = Number.isFinite(amountFromGateway) ? amountFromGateway : totalAmount;
        const payUrl = gatewayData.redirect_url || gatewayData.checkout_url || "";

        // Build QR image based on channel capability (verified from live API test)
        let qrImage = "";
        if (selectedChannel.hasQr) {
            qrImage =
                gatewayData.qrcode_url ||
                (gatewayData.qr_content
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=${encodeURIComponent(gatewayData.qr_content)}`
                    : "");
        }

        // Build VA number based on channel capability
        const vaNumber = selectedChannel.hasVa
            ? String(
                gatewayData.virtual_account ||
                gatewayData.va_number ||
                gatewayData.payment_no ||
                gatewayData.pay_no ||
                ""
            )
            : "";

        // Checkout URL for e-wallets
        const checkoutUrl = selectedChannel.hasCheckoutUrl
            ? (gatewayData.checkout_url || "")
            : "";

        // Save transaction to DB
        const transaction = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                paymentId,
                amount: finalAmount,
                credits: creditsToGive,
                bonusCredits: bonusToGive,
                days: activeDays,
                status: "pending",
                payUrl: payUrl || null,
                qrImage: qrImage || null,
            },
        });

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                paymentId,
                amount: finalAmount,
                serviceId: selectedService,
                serviceName: selectedChannel.name,
                channelCategory: selectedChannel.category,
                baseAmount,
                appFee,
                credits: creditsToGive,
                days: activeDays,
                qrImage,
                vaNumber,
                payUrl,
                checkoutUrl,
                expiredAt: gatewayData.expired_at || "",
            },
        });
    } catch (error) {
        console.error("Create TopUp Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}
