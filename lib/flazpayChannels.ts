export type FlazpayFeeType = "fixed" | "percent";
export type FlazpayChannelCategory = "va" | "qris" | "ewallet";

export interface FlazpayPaymentChannel {
    id: string;
    name: string;
    shortName: string;
    category: FlazpayChannelCategory;
    feeLabel: string;
    feeType: FlazpayFeeType;
    feeValue: number;        // fixed = Rupiah, percent = angka persen (0.7 = 0.7%)
    minAmount: number;
    maxAmount: number;
    hasQr: boolean;          // true jika API return qr_content + qrcode_url
    hasVa: boolean;          // true jika API return virtual_account
    hasCheckoutUrl: boolean; // true jika API return checkout_url (e-wallet)
    available: boolean;      // false = A400 dari API, tidak aktif di merchant ini
}

/**
 * Data diverifikasi langsung dari live API test Flazpay 20 April 2026
 * Amount test: Rp 15.000 | MID: FP_20260419180954
 *
 * Channel 3  (CIMB)        → ERROR A400 (tidak aktif)
 * Channel 9  (BNC)         → ERROR A400 (tidak aktif)
 * Channel 14 (QRIS Realtime) → tidak ada qr_content, hanya redirect_url
 */
export const FLAZPAY_PAYMENT_CHANNELS: FlazpayPaymentChannel[] = [
    {
        id: "1",
        name: "Virtual Account BCA",
        shortName: "BCA",
        category: "va",
        // Real test: amount 15000 → charged 22500, fee 7000 → actual fee ~Rp 7.000
        feeLabel: "Rp 7.000",
        feeType: "fixed",
        feeValue: 7000,
        minAmount: 10000,
        maxAmount: 10000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "2",
        name: "Virtual Account BRI",
        shortName: "BRI",
        category: "va",
        // Real test: amount 15000 → charged 20500, fee balance delta = Rp 3.000
        feeLabel: "Rp 3.000",
        feeType: "fixed",
        feeValue: 3000,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "3",
        name: "Virtual Account Bank CIMB",
        shortName: "CIMB",
        category: "va",
        feeLabel: "Rp 3.500",
        feeType: "fixed",
        feeValue: 3500,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: false, // ← API returned CODE A400, tidak aktif di merchant ini
    },
    {
        id: "4",
        name: "Virtual Account Bank BNI",
        shortName: "BNI",
        category: "va",
        // Real test: amount 15000 → charged 23500, fee delta = Rp 4.500 (bukan 4000)
        feeLabel: "Rp 4.500",
        feeType: "fixed",
        feeValue: 4500,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "5",
        name: "Virtual Account Bank MANDIRI",
        shortName: "Mandiri",
        category: "va",
        // Real test: amount 15000 → charged 20500, fee = Rp 3.000 (bukan 2.500)
        feeLabel: "Rp 3.000",
        feeType: "fixed",
        feeValue: 3000,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "6",
        name: "Virtual Account Bank Permata",
        shortName: "Permata",
        category: "va",
        // Real test: amount 15000 → charged 20500, fee = Rp 3.000 (bukan 2.500)
        feeLabel: "Rp 3.000",
        feeType: "fixed",
        feeValue: 3000,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "7",
        name: "Virtual Account Bank DANAMON",
        shortName: "Danamon",
        category: "va",
        // Real test: amount 15000 → charged 20500, fee = Rp 3.000 (bukan 2.500)
        feeLabel: "Rp 3.000",
        feeType: "fixed",
        feeValue: 3000,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "8",
        name: "Virtual Account Bank BSI",
        shortName: "BSI",
        category: "va",
        // Real test: amount 15000 → charged 22500, fee = Rp 3.500 (bukan 4.000)
        feeLabel: "Rp 3.500",
        feeType: "fixed",
        feeValue: 3500,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "9",
        name: "Virtual Account Bank BNC (Neo Commerce)",
        shortName: "BNC",
        category: "va",
        feeLabel: "Rp 4.000",
        feeType: "fixed",
        feeValue: 4000,
        minAmount: 10000,
        maxAmount: 50000000,
        hasQr: false,
        hasVa: true,
        hasCheckoutUrl: false,
        available: false, // ← API returned CODE A400, tidak aktif di merchant ini
    },
    {
        id: "10",
        name: "QRIS FLAZDIGITAL Multikoneksi",
        shortName: "QRIS Multi",
        category: "qris",
        // Real test: amount 15000 → charged 15105 → fee Rp 105 → 0.7%
        feeLabel: "0.7%",
        feeType: "percent",
        feeValue: 0.7,
        minAmount: 1000,
        maxAmount: 10000000,
        hasQr: true,
        hasVa: false,
        hasCheckoutUrl: false,
        available: true,
    },
    {
        id: "11",
        name: "OVO",
        shortName: "OVO",
        category: "ewallet",
        // Real test: amount 15000 → charged 15992 → ~3.5% (checkout_url kosong)
        feeLabel: "3.5%",
        feeType: "percent",
        feeValue: 3.5,
        minAmount: 1000,
        maxAmount: 2000000,
        hasQr: false,
        hasVa: false,
        hasCheckoutUrl: true, // checkout_url ada (meskipun bisa kosong string untuk OVO)
        available: true,
    },
    {
        id: "12",
        name: "DANA",
        shortName: "DANA",
        category: "ewallet",
        // Real test: amount 15000 → charged 15992 → ~3.5%, checkout_url: m.dana.id
        feeLabel: "3.5%",
        feeType: "percent",
        feeValue: 3.5,
        minAmount: 1000,
        maxAmount: 2000000,
        hasQr: false,
        hasVa: false,
        hasCheckoutUrl: true,
        available: true,
    },
    {
        id: "13",
        name: "LINKAJA",
        shortName: "LinkAja",
        category: "ewallet",
        // Real test: amount 15000 → charged 15992 → ~3.5%, checkout_url: linkaja.id
        feeLabel: "3.5%",
        feeType: "percent",
        feeValue: 3.5,
        minAmount: 1000,
        maxAmount: 2000000,
        hasQr: false,
        hasVa: false,
        hasCheckoutUrl: true,
        available: true,
    },
    {
        id: "14",
        name: "QRIS FLAZ PAYMENT (Realtime)",
        shortName: "QRIS Realtime",
        category: "qris",
        // Real test: amount 15000 → charged 15135 → fee Rp 135 → ~0.9%
        // CATATAN: API tidak return qr_content/qrcode_url, hanya redirect_url
        feeLabel: "0.9%",
        feeType: "percent",
        feeValue: 0.9,
        minAmount: 1000,
        maxAmount: 1000000,
        hasQr: false,    // ← Confirmed from live test: tidak ada qr_content
        hasVa: false,
        hasCheckoutUrl: false,
        available: true,
    },
];

/** Hanya channel yang aktif (bisa digunakan di merchant) */
export const AVAILABLE_PAYMENT_CHANNELS = FLAZPAY_PAYMENT_CHANNELS.filter(
    (ch) => ch.available
);

export function getFlazpayChannelById(serviceId: string): FlazpayPaymentChannel | undefined {
    return FLAZPAY_PAYMENT_CHANNELS.find((channel) => channel.id === serviceId);
}

export function formatIdr(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Hitung estimasi fee berdasarkan data channel */
export function estimateFee(amount: number, channel: FlazpayPaymentChannel): number {
    if (channel.feeType === "fixed") return channel.feeValue;
    return Math.ceil(amount * (channel.feeValue / 100));
}

/** Hitung estimasi total yang akan dicharge ke user */
export function estimateTotal(amount: number, channel: FlazpayPaymentChannel, typeFee: "1" | "2" = "1"): number {
    if (typeFee === "2") return amount; // fee ditanggung merchant
    return amount + estimateFee(amount, channel);
}

export function validateAmountByChannel(
    amount: number,
    channel: FlazpayPaymentChannel
): { ok: boolean; message?: string } {
    if (!channel.available) {
        return {
            ok: false,
            message: `Channel ${channel.name} tidak tersedia saat ini.`,
        };
    }

    if (amount < channel.minAmount) {
        return {
            ok: false,
            message: `Nominal untuk ${channel.name} minimal ${formatIdr(channel.minAmount)}.`,
        };
    }

    if (amount > channel.maxAmount) {
        return {
            ok: false,
            message: `Nominal untuk ${channel.name} maksimal ${formatIdr(channel.maxAmount)}.`,
        };
    }

    return { ok: true };
}