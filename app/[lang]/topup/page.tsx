"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Coins, Clock, ChevronRight, QrCode, Loader2, X, Check, History, Gem } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import RealtimeCredits from "@/components/RealtimeCredits";
import RealtimeBonus from "@/components/RealtimeBonus";
import UnlimitedBadge from "@/components/UnlimitedBadge";
import {
    FLAZPAY_PAYMENT_CHANNELS,
    getFlazpayChannelById,
    validateAmountByChannel,
} from "@/lib/flazpayChannels";

const ADMIN_FEE_PERCENT = 2.5;
const calcAdminFee = (amount: number) => Math.ceil(amount * ADMIN_FEE_PERCENT / 100);
const calcTotal = (amount: number) => amount + calcAdminFee(amount);
const calculateCreditsFromAmount = (amount: number) => {
    if (amount >= 20000) return Math.floor(amount * 2.25);
    if (amount >= 10000) return Math.floor(amount * 1.45);
    return Math.floor(amount * 1.5);
};

/* ─── Types ──────────────────────────────────────────── */
interface PaymentData {
    id: string;
    amount: number;
    expired_at: string;
    url: string;
    qr_image: string;
    va_number?: string;
    service_name?: string;
    channel_category?: "va" | "qris" | "ewallet";
    checkout_url?: string;
    base_amount?: number;
    app_fee?: number;
}

/* ─── Pricing Data ───────────────────────────────────── */
const packages: Array<{ id: string; name: string; price: number; credits: number; period: string; popular: boolean }> = [];

const vipPackages = [
    {
        id: "vip-7",
        name: "VIP 7 Hari",
        price: 7500,
        creditsDesc: "Unlimited Kredit Download & Tools",
        period: "7 Hari",
        popular: false,
        benefits: ["Unlimited Request Semua Fitur"],
        gradient: "from-amber-400 via-orange-400 to-amber-600",
        shadow: "shadow-orange-500/20"
    },
    {
        id: "vip-14",
        name: "VIP 14 Hari",
        price: 14000,
        creditsDesc: "Unlimited Kredit Download & Tools",
        period: "14 Hari",
        popular: true,
        benefits: ["Unlimited Request Semua Fitur"],
        gradient: "from-amber-400 via-orange-400 to-amber-600",
        shadow: "shadow-orange-500/20"
    },
    {
        id: "vip-30",
        name: "VIP 30 Hari",
        price: 25000,
        creditsDesc: "Unlimited Kredit Download & Tools",
        period: "30 Hari",
        popular: false,
        benefits: ["Unlimited Request Semua Fitur"],
        gradient: "from-amber-400 via-orange-400 to-amber-600",
        shadow: "shadow-orange-500/20"
    }
];

/* ─── Component ──────────────────────────────────────── */
const SESSION_KEY = "inversave_checkout_";

function TopUpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [customNominal, setCustomNominal] = useState<number | "">("");
    const [selectedServiceId, setSelectedServiceId] = useState<string>("14");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paidSuccess, setPaidSuccess] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const channelListRef = useRef<HTMLDivElement | null>(null);
    const [creditInfo, setCreditInfo] = useState<{ credits: number; role: string; bonusCredits?: number }>({ credits: 0, role: "free", bonusCredits: 0 });

    // Show success banner when returning from checkout with ?paid=1
    useEffect(() => {
        if (searchParams.get("paid") === "1") {
            setPaidSuccess(true);
            // Replace URL to remove query param without reload
            window.history.replaceState({}, "", window.location.pathname);
            // Auto dismiss after 6s
            const t = setTimeout(() => setPaidSuccess(false), 6000);
            return () => clearTimeout(t);
        }
    }, [searchParams]);

    // Fetch real credit info on mount and after successful payment
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch("/api/user/credits");
                if (!res.ok) return;
                const data = await res.json();
                if (data.credits !== undefined) {
                    setCreditInfo({ credits: data.credits, role: data.role || "free", bonusCredits: data.bonusCredits || 0 });
                }
            } catch { /* ignore */ }
        };
        fetchCredits();
        const interval = setInterval(fetchCredits, 5000);
        return () => clearInterval(interval);
    }, [paidSuccess]);

    useEffect(() => {
        const listElement = channelListRef.current;
        if (!listElement) return;

        const selectedElement = listElement.querySelector<HTMLButtonElement>(`[data-channel-id="${selectedServiceId}"]`);
        if (!selectedElement) return;

        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [selectedServiceId]);

    const formatIDR = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleCustomNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val === "") {
            setCustomNominal("");
        } else {
            setCustomNominal(Number(val));
        }
    };

    const handleNominalBlur = () => {
        if (typeof customNominal === "number" && customNominal > 0 && customNominal < 1000) {
            setCustomNominal(1000);
        }
    };

    const customCredits = typeof customNominal === "number" ? calculateCreditsFromAmount(customNominal) : 0;
    const customTopupEnabled = false;
    const selectedChannel = getFlazpayChannelById(selectedServiceId) || FLAZPAY_PAYMENT_CHANNELS[0];
    const customTotalAmount = typeof customNominal === "number" ? calcTotal(customNominal) : 0;
    const customChannelValidation =
        typeof customNominal === "number"
            ? validateAmountByChannel(customTotalAmount, selectedChannel)
            : { ok: true };
    const selectedVipPackage = vipPackages.find((pkg) => pkg.id === selectedPackage) || null;
    const selectedVipTotalAmount = selectedVipPackage ? calcTotal(selectedVipPackage.price) : 0;
    const selectedVipChannelValidation = selectedVipPackage
        ? validateAmountByChannel(selectedVipTotalAmount, selectedChannel)
        : { ok: false, message: "Pilih paket VIP dulu sebelum pilih channel pembayaran." };

    /* ─── Create Payment ───────────────────────────────── */
    const createPayment = async (packageId?: string, customAmount?: number, serviceIdOverride?: string) => {
        setIsLoading(true);
        setPaymentError(null);

        try {
            const lang = window.location.pathname.split("/")[1] || "id";
            const serviceIdToUse = serviceIdOverride || selectedServiceId;
            const res = await fetch("/api/topup/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    packageId
                        ? { packageId, serviceId: serviceIdToUse }
                        : { customAmount: String(customAmount), serviceId: serviceIdToUse }
                ),
            });

            const data = await res.json();

            if (!data.success) {
                setPaymentError(data.error || "Gagal membuat pembayaran.");
                return;
            }

            const tx = data.transaction;
            // Store checkout data in sessionStorage so checkout page can read it
            sessionStorage.setItem(SESSION_KEY + tx.paymentId, JSON.stringify({
                paymentId: tx.paymentId,
                amount: tx.amount,
                serviceName: tx.serviceName,
                channelCategory: tx.channelCategory || "va",
                qrImage: tx.qrImage || "",
                vaNumber: tx.vaNumber || "",
                payUrl: tx.payUrl || "",
                checkoutUrl: tx.checkoutUrl || "",
                expiredAt: tx.expiredAt || "",
                baseAmount: tx.baseAmount || 0,
                appFee: tx.appFee || 0,
                createdAt: Date.now(),
            }));

            // Redirect to dedicated checkout page
            router.push(`/${lang}/checkout/${tx.paymentId}`);
        } catch {
            setPaymentError("Terjadi kesalahan jaringan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePackagePayment = (pkgId: string, serviceIdOverride?: string) => {
        const serviceIdToUse = serviceIdOverride || selectedServiceId;
        const channel = getFlazpayChannelById(serviceIdToUse) || selectedChannel;
        const pkg = [...packages, ...vipPackages].find((item) => item.id === pkgId);
        if (pkg) {
            const channelValidation = validateAmountByChannel(calcTotal(pkg.price), channel);
            if (!channelValidation.ok) {
                setPaymentError(channelValidation.message || "Nominal tidak sesuai untuk channel pembayaran ini.");
                return;
            }
        }

        setSelectedPackage(pkgId);
        createPayment(pkgId, undefined, serviceIdToUse);
    };

    const handleConfirmVipPayment = () => {
        if (!selectedPackage) {
            setPaymentError("Pilih paket VIP dulu sebelum konfirmasi pembayaran.");
            return;
        }

        if (!selectedVipChannelValidation.ok) {
            setPaymentError(selectedVipChannelValidation.message || "Nominal paket tidak sesuai untuk channel pembayaran ini.");
            return;
        }

        handlePackagePayment(selectedPackage, selectedServiceId);
    };

    const handleCustomPayment = () => {
        if (!customTopupEnabled) {
            setPaymentError("Top up custom dinonaktifkan. Pilih paket VIP.");
            return;
        }

        if (typeof customNominal === "number" && customNominal >= 1000) {
            if (!customChannelValidation.ok) {
                setPaymentError(customChannelValidation.message || "Nominal tidak sesuai untuk channel pembayaran ini.");
                return;
            }
            createPayment(undefined, customNominal);
        }
    };

    const closeErrorModal = () => {
        setPaymentError(null);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl font-sans min-h-screen">

            {/* ─── Success Banner (after checkout paid) ─── */}
            <AnimatePresence>
                {paidSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -60, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4"
                    >
                        <div className="flex items-center gap-4 bg-[#a0d1d6] border-[3px] border-black rounded-2xl px-5 py-4 shadow-neo">
                            <div className="w-10 h-10 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shrink-0">
                                <Check className="w-6 h-6 text-black" strokeWidth={3} />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-black uppercase tracking-wide">Pembayaran Berhasil!</p>
                                <p className="text-sm font-bold text-black/70">Paket VIP kamu sudah aktif 🎉</p>
                            </div>
                            <button
                                onClick={() => setPaidSuccess(false)}
                                className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight uppercase">
                        Paket <span className="text-black inline-block -rotate-2 bg-primary px-2 border-[3px] border-black rounded-lg shadow-neo-sm">VIP</span>
                    </h1>
                    <p className="mt-4 text-black/80 font-bold text-lg">Pilih paket VIP dulu, lanjut pilih channel, lalu konfirmasi pembayaran.</p>
                    <p className="mt-1.5 text-sm text-black/60 font-semibold italic">* Setiap transaksi kena fee aplikasi 2.5% untuk semua channel.</p>
                </div>
                <Link href="/topup/history">
                    <Button
                        variant="outline"
                        className="rounded-xl border-[3px] border-black hover:bg-secondary hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo font-black gap-2 shrink-0 transition-all text-base"
                    >
                        <History className="w-5 h-5" strokeWidth={3} />
                        <span className="hidden sm:inline">Riwayat</span>
                    </Button>
                </Link>
            </div>

            {/* 1. Credit Balance Banner */}
            <div className="mb-12 p-6 md:p-8 bg-[#ffb3c6] border-[3px] border-black shadow-neo rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 relative z-10">
                    <div>
                        <p className="text-sm font-black text-black mb-2 uppercase tracking-wider bg-white px-3 py-1 rounded-lg border-2 border-black inline-block">Kredit Reguler</p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 bg-white rounded-xl border-2 border-black flex items-center justify-center -rotate-6">
                                <Zap className="w-7 h-7 text-black" strokeWidth={3} fill="currentColor" />
                            </div>
                            <span className="text-5xl font-black tracking-tighter text-black">
                                <RealtimeCredits initialCredits={creditInfo.credits} />
                            </span>
                        </div>
                    </div>

                    <div className="hidden sm:block h-16 w-[3px] bg-black rounded-full"></div>

                    <div>
                        <p className="text-sm font-black text-black mb-2 uppercase tracking-wider bg-white px-3 py-1 rounded-lg border-2 border-black inline-block">Bonus Kredit</p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center rotate-6">
                                <Gem className="w-5 h-5 text-black" strokeWidth={3} />
                            </div>
                            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-black">
                                <RealtimeBonus initialBonus={creditInfo.bonusCredits || 0} />
                            </span>
                        </div>
                    </div>

                    <div className="hidden sm:block h-16 w-[3px] bg-black rounded-full"></div>

                    <div>
                        <p className="text-sm font-black text-black mb-2 uppercase tracking-wider bg-white px-3 py-1 rounded-lg border-2 border-black inline-block">Streaming</p>
                        <div className="flex items-center mt-2">
                            {(creditInfo.role === "vip" || creditInfo.role === "vip-max") ? (
                                <UnlimitedBadge />
                            ) : (
                                <Badge variant="outline" className="text-black bg-white border-[3px] border-black font-black text-xs px-3 py-1 rounded-xl">Reguler</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="hidden sm:block relative z-10">
                    <div className="bg-white border-[3px] border-black rounded-xl px-4 py-2 text-sm text-black font-bold whitespace-nowrap shadow-neo-sm">
                        Status: <span className="text-primary font-black uppercase">{
                            creditInfo.role === "vip-max" ? "VIP Plus" :
                                creditInfo.role === "vip" ? "VIP" :
                                    creditInfo.role === "premium" ? "Premium" : "Free"
                        }</span>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                {/* 2. Pricing Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {packages.map((pkg, index) => {
                        const bgColors = ["bg-[#a0d1d6]", "bg-[#ffb3c6]", "bg-[#c4b5fd]", "bg-[#ffeb3b]"];
                        const bgColor = bgColors[index % bgColors.length];
                        const channelValidation = validateAmountByChannel(calcTotal(pkg.price), selectedChannel);
                        const channelDisabled = !channelValidation.ok;
                        return (
                        <motion.div
                            key={pkg.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Card
                                className={`relative h-full cursor-pointer transition-all duration-300 rounded-3xl border-[3px] border-black p-5 sm:p-6 ${selectedPackage === pkg.id
                                    ? `shadow-neo -translate-y-1 -translate-x-1 ${bgColor}`
                                    : "bg-white hover:shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1"
                                    }`}
                                onClick={() => setSelectedPackage(pkg.id)}
                            >
                                {pkg.popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white hover:bg-black rounded-xl px-4 py-1 font-black text-xs shadow-none border-[3px] border-black whitespace-nowrap">
                                        POPULAR
                                    </Badge>
                                )}
                                <div className="space-y-4">
                                    {/* Period Badge */}
                                    <Badge variant="outline" className="bg-white border-2 border-black text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl">
                                        {pkg.period}
                                    </Badge>

                                    {/* Package Name */}
                                    <h3 className="font-black text-black text-2xl tracking-tight">{pkg.name}</h3>

                                    {/* Credits & Period */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-black/80 font-bold">
                                            <Coins className="w-4 h-4 shrink-0 text-black hidden" />
                                            <span>{pkg.credits.toLocaleString("id-ID")} Kredit</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-black/80 font-bold">
                                            <Clock className="w-4 h-4 shrink-0 text-black hidden" />
                                            <span>{pkg.period}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="pt-2 pb-4">
                                        <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">{formatIDR(pkg.price)}</p>
                                        {!channelValidation.ok && (
                                            <p className="text-xs font-black text-red-600 mt-2 uppercase tracking-wide">
                                                {channelValidation.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Button */}
                                    <Button
                                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                                        disabled={isLoading || channelDisabled}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPackage(pkg.id);
                                            setPaymentError(null);
                                        }}
                                        className={`w-full h-12 text-base font-black rounded-xl transition-all duration-300 border-[3px] border-black ${selectedPackage === pkg.id
                                            ? "bg-white text-black hover:bg-black hover:text-white"
                                            : "bg-primary text-black hover:bg-primary/90 shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                                            }`}
                                    >
                                        {isLoading && selectedPackage === pkg.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            selectedPackage === pkg.id ? "Paket Terpilih" : "Pilih Paket"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                        );
                    })}
                </div>

                {/* VIP Packages Grid */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="h-[3px] bg-black flex-1 rounded-full"></div>
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border-[3px] border-black shadow-neo-sm">
                        <span className="text-base font-black text-black uppercase tracking-widest shrink-0 flex items-center gap-2">
                            <Gem className="w-5 h-5 text-black" strokeWidth={3} />
                            VIP Packages
                        </span>
                    </div>
                    <div className="h-[3px] bg-black flex-1 rounded-full"></div>
                </div>

                <div className="mb-16 flex justify-center">
                    {vipPackages.map((pkg) => (
                        <motion.div
                            key={pkg.id}
                            whileHover={{ scale: 1.03, y: -6 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 320, damping: 25 }}
                            className="w-full max-w-xl"
                        >
                            <Card
                                className={`relative overflow-hidden rounded-3xl border-[3px] border-black shadow-neo h-full cursor-pointer transition-all duration-300 ${selectedPackage === pkg.id ? "-translate-y-1 -translate-x-1" : "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"}`}
                                onClick={() => setSelectedPackage(pkg.id)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#d8f8ef] via-[#a4ead7] to-[#6fd5c1]" aria-hidden />
                                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,#ffffff_0,transparent_45%)]" aria-hidden />
                                <div className="relative z-10 p-6 md:p-8 flex flex-col h-full gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-2">
                                            <Badge variant="outline" className="bg-white/80 border-2 border-black text-xs font-black uppercase tracking-widest px-3 py-1 rounded-xl text-black">
                                                {pkg.period}
                                            </Badge>
                                            <h3 className="font-black text-3xl tracking-tight text-black drop-shadow-sm">{pkg.name}</h3>
                                            <p className="text-4xl font-black text-black tracking-tight drop-shadow-sm">{formatIDR(pkg.price)}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2 bg-black text-white px-3 py-2 rounded-xl border-2 border-white/70 shadow-neo-sm">
                                            <Zap className="w-4 h-4" strokeWidth={3} />
                                            <span className="text-xs font-black uppercase tracking-widest">Best Deal</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-sm border-[3px] border-black rounded-2xl p-5 shadow-neo-sm space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#c7f1e3] border-2 border-black flex items-center justify-center shrink-0">
                                                <Coins className="w-4 h-4 text-black" />
                                            </div>
                                            <span className="text-sm font-bold text-black leading-snug">{pkg.creditsDesc}</span>
                                        </div>
                                        {pkg.benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 border-2 border-black">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-sm font-bold text-black leading-snug">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                                        disabled={isLoading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPackage(pkg.id);
                                            setPaymentError(null);
                                        }}
                                        className={`w-full h-12 text-sm font-black rounded-xl transition-all duration-300 border-[3px] border-black ${selectedPackage === pkg.id
                                            ? "bg-black text-white"
                                            : "bg-white text-black hover:bg-black hover:text-white"}`}
                                    >
                                        {isLoading && selectedPackage === pkg.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            selectedPackage === pkg.id ? "Paket Terpilih" : "Pilih VIP"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Payment Channel Selector */}
                <div className="mb-12 bg-white border-[3px] border-black rounded-3xl p-5 md:p-6 shadow-neo overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.16em] text-black/70">Langkah 2: Channel Pembayaran</p>
                                <h2 className="text-2xl font-black text-black mt-1">Pilih Metode Pembayaran</h2>
                                <p className="text-xs font-bold text-black/70 mt-2">
                                    Card payment bisa di-scroll. Setelah pilih channel, klik tombol konfirmasi di bawah.
                                </p>
                            </div>
                            <Badge className="w-fit border-[3px] border-black bg-[#ffeb3b] text-black rounded-xl px-3 py-1 font-black uppercase text-[11px] tracking-wide">
                                Aktif: {selectedChannel.name}
                            </Badge>
                        </div>

                        {selectedVipPackage ? (
                            <div className="bg-[#f8fafc] border-[3px] border-black rounded-2xl p-4 space-y-1">
                                <p className="text-xs font-black uppercase tracking-wider text-black/70">Paket Terpilih</p>
                                <p className="text-lg font-black text-black">{selectedVipPackage.name}</p>
                                <p className="text-sm font-bold text-black/80">Total Bayar: {formatIDR(selectedVipTotalAmount)}</p>
                            </div>
                        ) : (
                            <p className="text-sm font-black text-red-600 bg-red-50 border-2 border-red-600 rounded-xl px-4 py-3">
                                Pilih paket VIP dulu, baru pilih channel pembayaran.
                            </p>
                        )}

                        <div
                            ref={channelListRef}
                            className="payment-channel-scrollbar min-h-[320px] max-h-[62dvh] sm:max-h-[520px] overflow-y-auto overscroll-y-contain touch-pan-y pr-1 pb-2 space-y-2 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
                        >
                            {FLAZPAY_PAYMENT_CHANNELS.map((channel) => (
                                <button
                                    key={channel.id}
                                    type="button"
                                    data-channel-id={channel.id}
                                    onClick={() => {
                                        setSelectedServiceId(channel.id);
                                        setPaymentError(null);
                                    }}
                                    className={`w-full text-left rounded-2xl border-[3px] p-3 md:p-4 transition-all ${selectedServiceId === channel.id
                                        ? "border-black bg-[#c4b5fd] shadow-neo-sm"
                                        : "border-black/70 bg-white hover:bg-[#f8fafc] hover:-translate-y-0.5"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-black text-black text-sm sm:text-base leading-tight">
                                                ID {channel.id} • {channel.name}
                                            </p>
                                            <p className="text-xs sm:text-sm font-bold text-black/75 mt-2">
                                                Fee Channel {channel.feeLabel} • Fee Aplikasi 2.5%
                                            </p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-[3px] ${selectedServiceId === channel.id ? "bg-black border-black" : "bg-white border-black/60"}`} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedVipPackage && !selectedVipChannelValidation.ok && (
                            <p className="text-sm font-black text-red-600 bg-red-50 border-2 border-red-600 rounded-xl px-4 py-3">
                                {selectedVipChannelValidation.message}
                            </p>
                        )}

                        <Button
                            onClick={handleConfirmVipPayment}
                            disabled={isLoading || !selectedVipPackage || !selectedVipChannelValidation.ok}
                            className="w-full h-12 text-sm md:text-base font-black rounded-xl border-[3px] border-black bg-black text-white hover:bg-black/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Konfirmasi Pembayaran"
                            )}
                        </Button>
                    </div>
                </div>

                {/* 4. Custom Nominal Section */}
                {customTopupEnabled && (
                <div className="bg-[#a0d1d6] border-[3px] border-black rounded-3xl p-6 md:p-10 shadow-neo relative overflow-hidden group">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-block bg-white text-black text-xs font-black uppercase tracking-wider py-1 px-3 rounded-lg border-2 border-black mb-4">Alternatif</div>
                            <h3 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight text-black uppercase">Beli Nominal <span className="bg-white px-2 border-2 border-black rounded-lg inline-block -rotate-2">Custom</span></h3>
                            <p className="text-black/80 font-bold text-lg mb-8 leading-relaxed">Masukkan nominal sesuai keinginanmu. Minimal Rp 1.000, kelipatan bebas. Kredit mengikuti skema paket Starter/Basic/Pro.</p>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-black uppercase tracking-wide">Masukkan Nominal (Rp)</label>
                                <div className="relative group/input">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-black transition-colors">Rp</span>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={customNominal ? customNominal.toLocaleString('id-ID') : ''}
                                        onChange={handleCustomNominalChange}
                                        onBlur={handleNominalBlur}
                                        placeholder="1.000"
                                        className="pl-14 bg-white border-[3px] border-black text-black placeholder:text-black/40 focus-visible:ring-0 focus-visible:border-black h-14 text-xl font-bold rounded-xl transition-all shadow-neo-sm"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 font-black uppercase tracking-widest pointer-events-none">IDR</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 md:p-8 border-[3px] border-black shadow-neo-sm h-full flex flex-col justify-between">
                            <div className="grid grid-cols-2 gap-4 mb-8 h-full">
                                <div className="bg-[#ffeb3b] rounded-xl p-4 border-[3px] border-black flex flex-col justify-center">
                                    <p className="text-xs font-black text-black mb-2 uppercase tracking-wide">Total Kredit</p>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-black" strokeWidth={3} />
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={customCredits}
                                                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                                transition={{ duration: 0.2 }}
                                                className="text-3xl font-black text-black tracking-tighter"
                                            >
                                                {customCredits > 0 ? customCredits.toLocaleString('id-ID') : "0"}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="bg-[#ffb3c6] rounded-xl p-4 border-[3px] border-black flex flex-col justify-center">
                                    <p className="text-xs font-black text-black mb-2 uppercase tracking-wide">Masa Aktif</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-black" strokeWidth={3} />
                                        <p className="text-xl font-black text-black">30 Hari</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Fee Summary */}
                            {typeof customNominal === "number" && customNominal >= 1000 && (
                                <div className="space-y-2 text-sm mb-6 bg-gray-50 rounded-xl p-4 border-2 border-black font-bold">
                                    <div className="flex justify-between text-black/80">
                                        <span>Nominal</span>
                                        <span>{formatIDR(customNominal)}</span>
                                    </div>
                                    <div className="flex justify-between text-black/80">
                                        <span>Biaya Admin</span>
                                        <span>{formatIDR(calcAdminFee(customNominal))}</span>
                                    </div>
                                    <div className="h-[2px] w-full bg-black my-2 rounded-full" />
                                    <div className="flex justify-between font-black text-black text-base">
                                        <span>Total Bayar</span>
                                        <span>{formatIDR(calcTotal(customNominal))}</span>
                                    </div>
                                    {!customChannelValidation.ok && (
                                        <p className="text-xs font-black text-red-600 pt-2 uppercase tracking-wide">
                                            {customChannelValidation.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            <Button
                                className="w-full bg-primary text-black border-[3px] border-black hover:bg-primary/90 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo h-14 font-black text-lg rounded-xl shadow-neo-sm transition-all duration-300"
                                disabled={!customNominal || customNominal < 1000 || isLoading || !customChannelValidation.ok}
                                onClick={handleCustomPayment}
                            >
                                {isLoading && !selectedPackage ? (
                                    <>
                                        <Loader2 className="mr-2 w-6 h-6 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Lanjutkan
                                        <ChevronRight className="ml-2 w-6 h-6" strokeWidth={3} />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* 4. Footer Notes */}
            <div className="mt-12 pt-8 border-t-[3px] border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-black">
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border-[3px] border-black shadow-neo-sm">
                        <div className="bg-[#ffeb3b] p-3 rounded-xl border-[3px] border-black shrink-0">
                            <Zap className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-black text-black mb-1 uppercase tracking-wide">Paket VIP</p>
                            <p className="font-bold text-black/80 leading-relaxed">Semua paket VIP aktifkan unlimited request selama masa aktif paket.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#c4b5fd] border-[3px] border-black shadow-neo-sm">
                        <div className="bg-white p-3 rounded-xl border-[3px] border-black shrink-0">
                            <QrCode className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-black text-black mb-2 uppercase tracking-wide">Metode Pembayaran</p>
                            <div className="flex flex-col gap-1.5">
                                <Badge variant="outline" className="w-fit bg-white border-2 border-black text-black font-black uppercase text-xs shadow-neo-sm rounded-lg">
                                    QRIS All Payment
                                </Badge>
                                <p className="text-xs font-bold text-black/80 mt-1">
                                    Support Semua E-Wallet dan Bank
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ─── Error Modal ─────────────────────────────── */}
            <AnimatePresence>
                {paymentError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={closeErrorModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="bg-white rounded-3xl shadow-neo border-[3px] border-black w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-[#ffb3c6] rounded-t-[1.3rem]">
                                <h3 className="text-xl font-black text-black uppercase tracking-wide">Pembayaran Gagal</h3>
                                <button
                                    onClick={closeErrorModal}
                                    className="w-10 h-10 rounded-xl bg-white border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-colors"
                                >
                                    <X className="w-6 h-6" strokeWidth={3} />
                                </button>
                            </div>
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 rounded-2xl border-4 border-black bg-[#ffb3c6] flex items-center justify-center mx-auto -rotate-3 shadow-neo-sm">
                                    <X className="w-10 h-10 text-black" strokeWidth={4} />
                                </div>
                                <p className="text-black font-bold text-base leading-relaxed">{paymentError}</p>
                                <Button
                                    onClick={closeErrorModal}
                                    className="bg-black text-white hover:bg-black/80 font-black text-base px-8 rounded-xl border-[3px] border-black h-12 w-full uppercase"
                                >
                                    Tutup & Coba Lagi
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TopUpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <TopUpContent />
        </Suspense>
    );
}
