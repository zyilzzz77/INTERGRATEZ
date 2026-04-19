export type FlazpayFeeType = "fixed" | "percent";

export interface FlazpayPaymentChannel {
    id: string;
    name: string;
    feeLabel: string;
    feeType: FlazpayFeeType;
    feeValue: number;
    minAmount: number;
    maxAmount: number;
}

export const FLAZPAY_PAYMENT_CHANNELS: FlazpayPaymentChannel[] = [
    { id: "1", name: "Virtual Account BCA", feeLabel: "Rp 5.000", feeType: "fixed", feeValue: 5000, minAmount: 10000, maxAmount: 10000000 },
    { id: "2", name: "Virtual Account BRI", feeLabel: "Rp 3.000", feeType: "fixed", feeValue: 3000, minAmount: 10000, maxAmount: 50000000 },
    { id: "3", name: "Virtual Account Bank CIMB", feeLabel: "Rp 3.500", feeType: "fixed", feeValue: 3500, minAmount: 10000, maxAmount: 50000000 },
    { id: "4", name: "Virtual Account Bank BNI", feeLabel: "Rp 4.500", feeType: "fixed", feeValue: 4500, minAmount: 10000, maxAmount: 50000000 },
    { id: "5", name: "Virtual Account Bank MANDIRI", feeLabel: "Rp 3.000", feeType: "fixed", feeValue: 3000, minAmount: 10000, maxAmount: 50000000 },
    { id: "6", name: "Virtual Account Bank Permata", feeLabel: "Rp 3.000", feeType: "fixed", feeValue: 3000, minAmount: 10000, maxAmount: 50000000 },
    { id: "7", name: "Virtual Account BANK DANAMON", feeLabel: "Rp 3.000", feeType: "fixed", feeValue: 3000, minAmount: 10000, maxAmount: 50000000 },
    { id: "8", name: "Virtual Account BANK BSI", feeLabel: "Rp 4.000", feeType: "fixed", feeValue: 4000, minAmount: 10000, maxAmount: 50000000 },
    { id: "9", name: "Virtual Account BANK BNC (Neo Commerce)", feeLabel: "Rp 4.000", feeType: "fixed", feeValue: 4000, minAmount: 10000, maxAmount: 50000000 },
    { id: "10", name: "QRIS FLAZDIGITAL MULTIKONEKSI", feeLabel: "0.7%", feeType: "percent", feeValue: 0.7, minAmount: 100, maxAmount: 10000000 },
    { id: "11", name: "OVO", feeLabel: "3.5%", feeType: "percent", feeValue: 3.5, minAmount: 1000, maxAmount: 2000000 },
    { id: "12", name: "DANA", feeLabel: "3.5%", feeType: "percent", feeValue: 3.5, minAmount: 1000, maxAmount: 2000000 },
    { id: "13", name: "LINKAJA", feeLabel: "3.5%", feeType: "percent", feeValue: 3.5, minAmount: 1000, maxAmount: 2000000 },
    { id: "14", name: "QRIS FLAZ PAYMENT (REALTIME)", feeLabel: "0.9%", feeType: "percent", feeValue: 0.9, minAmount: 1000, maxAmount: 1000000 },
];

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

export function validateAmountByChannel(amount: number, channel: FlazpayPaymentChannel): { ok: boolean; message?: string } {
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