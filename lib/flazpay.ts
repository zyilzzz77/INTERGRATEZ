import crypto from "crypto";

const DEFAULT_CREATE_ENDPOINT = "https://flazpay.id/snap/v1/request/create";
const DEFAULT_EXPIRE_MINUTES = 15;

export type FlazpayNormalizedStatus = "paid" | "pending" | "failed" | "expired" | "unknown";

export interface FlazpayConfig {
    mid: string;
    clientId: string;
    clientSecret: string;
    service: string;
    typeFee: "1" | "2";
    createEndpoint: string;
    returnUrl: string;
    expireMinutes: number;
}

export function getFlazpayConfig(): FlazpayConfig {
    const expireRaw = Number(process.env.FLAZPAY_EXPIRE_MINUTES || DEFAULT_EXPIRE_MINUTES);

    return {
        mid: process.env.FLAZPAY_MID || "",
        clientId: process.env.FLAZPAY_CLIENT_ID || "",
        clientSecret: process.env.FLAZPAY_CLIENT_SECRET || "",
        service: process.env.FLAZPAY_SERVICE || "14",
        typeFee: process.env.FLAZPAY_TYPE_FEE === "2" ? "2" : "1",
        createEndpoint: process.env.FLAZPAY_CREATE_URL || DEFAULT_CREATE_ENDPOINT,
        returnUrl: process.env.FLAZPAY_RETURN_URL || "",
        expireMinutes: Number.isFinite(expireRaw) && expireRaw > 0 ? expireRaw : DEFAULT_EXPIRE_MINUTES,
    };
}

export function getMissingFlazpayEnv(config: FlazpayConfig): string[] {
    const missing: string[] = [];

    if (!config.mid) missing.push("FLAZPAY_MID");
    if (!config.clientId) missing.push("FLAZPAY_CLIENT_ID");
    if (!config.clientSecret) missing.push("FLAZPAY_CLIENT_SECRET");

    return missing;
}

function md5(value: string): string {
    return crypto.createHash("md5").update(value).digest("hex");
}

export type FlazpayCreateSignatureOrder = "mid-first" | "client-first";

export function createFlazpayNewSignature(params: {
    mid: string;
    clientId: string;
    clientSecret: string;
    uniqueCode: string;
    service: string;
    amount: string | number;
}, order: FlazpayCreateSignatureOrder = "client-first"): string {
    if (order === "client-first") {
        return md5(
            `${params.clientId}${params.clientSecret}${params.mid}${params.uniqueCode}${params.service}${params.amount}new`
        );
    }

    return md5(
        `${params.mid}${params.clientId}${params.clientSecret}${params.uniqueCode}${params.service}${params.amount}new`
    );
}

export function createFlazpayCallbackSignature(params: {
    mid: string;
    clientId: string;
    clientSecret: string;
    uniqueCode: string;
}): string {
    return md5(`${params.mid}${params.clientId}${params.clientSecret}${params.uniqueCode}CallbackStatus`);
}

export function createMerchantUniqueCode(prefix = "INV"): string {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${Date.now()}${randomPart}`;
}

export function normalizeFlazpayStatus(rawStatus: string): FlazpayNormalizedStatus {
    const value = rawStatus.trim().toLowerCase();

    if (value === "paid" || value === "success" || value === "settlement") return "paid";
    if (value === "pending" || value === "process") return "pending";
    if (value === "failed" || value === "fail") return "failed";
    if (value === "expired" || value === "expire") return "expired";

    return "unknown";
}

export function mapFlazpayCreateErrorMessage(rawMessage: string): string {
    const message = rawMessage.trim();
    const lower = message.toLowerCase();

    if (lower.includes("autentikasi gagal")) {
        return "Autentikasi gateway gagal. Pastikan merchant sudah Aktif (bukan Menunggu), MID/Client ID/Client Secret cocok, dan IP whitelist IPv4/IPv6 server sudah terdaftar.";
    }

    if (lower.includes("merchant tidak ditemukan")) {
        return "Merchant tidak ditemukan. Periksa kembali MID pada konfigurasi Flazpay.";
    }

    if (message) {
        return message;
    }

    return "Gagal membuat pembayaran. Coba lagi.";
}

export function isTransactionExpired(createdAt: Date, expireMinutes: number): boolean {
    const expireMs = new Date(createdAt).getTime() + expireMinutes * 60 * 1000;
    return Date.now() > expireMs;
}