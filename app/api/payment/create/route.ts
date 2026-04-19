import { NextRequest, NextResponse } from "next/server";
import {
    createFlazpayNewSignature,
    createMerchantUniqueCode,
    getFlazpayConfig,
    getMissingFlazpayEnv,
    mapFlazpayCreateErrorMessage,
} from "@/lib/flazpay";
import { getFlazpayChannelById, validateAmountByChannel } from "@/lib/flazpayChannels";

function buildReturnUrl(req: NextRequest, requestValue: unknown, configValue: string): string {
    if (typeof requestValue === "string" && requestValue.trim()) return requestValue.trim();
    if (configValue) return configValue;
    return `${req.nextUrl.origin}/topup`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, message, phoneNumber, service, typeFee, returnUrl } = body;

        if (!amount || typeof amount !== "number" || amount < 1000) {
            return NextResponse.json(
                { status: false, message: "Nominal minimal Rp 1.000" },
                { status: 400 }
            );
        }

        const flazpayConfig = getFlazpayConfig();
        const missingEnv = getMissingFlazpayEnv(flazpayConfig);
        if (missingEnv.length > 0) {
            return NextResponse.json(
                { status: false, message: `Konfigurasi Flazpay belum lengkap: ${missingEnv.join(", ")}` },
                { status: 500 }
            );
        }

        const incomingService =
            typeof service === "number"
                ? String(service)
                : typeof service === "string"
                    ? service.trim()
                    : "";
        const finalService = incomingService || flazpayConfig.service;
        const finalTypeFee = typeFee === "2" ? "2" : flazpayConfig.typeFee;

        const selectedChannel = getFlazpayChannelById(finalService);
        if (!selectedChannel) {
            return NextResponse.json(
                { status: false, message: "Channel pembayaran tidak valid." },
                { status: 400 }
            );
        }

        const channelAmountValidation = validateAmountByChannel(amount, selectedChannel);
        if (!channelAmountValidation.ok) {
            return NextResponse.json(
                { status: false, message: channelAmountValidation.message || "Nominal tidak valid untuk channel ini." },
                { status: 400 }
            );
        }

        const uniqueCode = createMerchantUniqueCode("INV");
        const note =
            typeof message === "string" && message.trim() ? message.trim() : "Top Up Kredit";

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
            uniqueCode,
            service: finalService,
            amount,
        };

        const primarySignature = createFlazpayNewSignature(signatureParams, "client-first");
        const fallbackSignature = createFlazpayNewSignature(signatureParams, "mid-first");

        const sendCreateRequest = async (signature: string) => {
            const payload = new URLSearchParams({
                mid: flazpayConfig.mid,
                client_id: flazpayConfig.clientId,
                client_secret: flazpayConfig.clientSecret,
                action: "new",
                unique_code: uniqueCode,
                service: finalService,
                type_fee: finalTypeFee,
                amount: String(amount),
                note,
                return_url: buildReturnUrl(req, returnUrl, flazpayConfig.returnUrl),
                signature,
            });

            if (typeof phoneNumber === "string" && phoneNumber.trim()) {
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
                { status: false, message: `Layanan pembayaran sedang gangguan (HTTP ${requestResult.status}). Coba lagi nanti.` },
                { status: 502 }
            );
        }

        if (requestResult.kind === "non-json") {
            console.error("Flazpay API returned non-JSON response:", requestResult.text.substring(0, 200));
            return NextResponse.json(
                { status: false, message: "Layanan pembayaran sedang tidak tersedia. Coba lagi nanti." },
                { status: 502 }
            );
        }

        const data = requestResult.data;

        if (!data.status || !data.data) {
            const gatewayMessage = String(data.msg || data.message || "");
            return NextResponse.json(
                { status: false, message: mapFlazpayCreateErrorMessage(gatewayMessage) },
                { status: 500 }
            );
        }

        const gatewayData = data.data as {
            pay_id?: string;
            unique_code?: string;
            amount?: string | number;
            redirect_url?: string;
            checkout_url?: string;
            qrcode_url?: string;
            qr_content?: string;
            expired_at?: string;
        };

        const qrImage =
            gatewayData.qrcode_url ||
            (gatewayData.qr_content
                ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(gatewayData.qr_content)}`
                : "");

        return NextResponse.json({
            status: true,
            data: {
                id: gatewayData.unique_code || gatewayData.pay_id || uniqueCode,
                amount: Number(gatewayData.amount || amount),
                service: finalService,
                service_name: selectedChannel.name,
                expired_at: gatewayData.expired_at || "",
                url: gatewayData.redirect_url || gatewayData.checkout_url || "",
                qr_image: qrImage,
            },
        });
    } catch (error) {
        console.error("Payment creation error:", error);
        return NextResponse.json(
            { status: false, message: "Terjadi kesalahan server." },
            { status: 500 }
        );
    }
}
