"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Clock, ChevronRight, QrCode, ExternalLink, Loader2, X, Copy, Check, CheckCircle2, RefreshCw, History, Gem } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import RealtimeCredits from "@/components/RealtimeCredits";
import RealtimeBonus from "@/components/RealtimeBonus";
import UnlimitedBadge from "@/components/UnlimitedBadge";

const ADMIN_FEE_PERCENT = 7.5;
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
}

/* ─── Pricing Data ───────────────────────────────────── */
const packages = [
    {
        id: "starter",
        name: "Starter",
        price: 5000,
        credits: 7500,
        period: "30 Hari",
        popular: false,
    },
    {
        id: "basic",
        name: "Basic",
        price: 10000,
        credits: 14500,
        period: "30 Hari",
        popular: true,
    },
    {
        id: "pro",
        name: "Pro",
        price: 20000,
        credits: 45000,
        period: "30 Hari",
        popular: false,
    },
];

const vipPackages = [
    {
        id: "vip-plus",
        name: "VIP Plus",
        price: 25000,
        creditsDesc: "Unlimited Kredit Download & Tools",
        period: "30 Hari",
        popular: true,
        benefits: ["Unlock Unlimited Streaming All Aplikasi Drama China"],
        gradient: "from-amber-400 via-orange-400 to-amber-600",
        shadow: "shadow-orange-500/20"
    }
];

/* ─── Component ──────────────────────────────────────── */
export default function TopUpPage() {
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [customNominal, setCustomNominal] = useState<number | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const [creditInfo, setCreditInfo] = useState<{ credits: number; role: string; bonusCredits?: number }>({ credits: 0, role: "free", bonusCredits: 0 });

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
    }, [paymentSuccess]);

    // Auto-poll payment status every 5 seconds
    useEffect(() => {
        if (paymentData && !paymentSuccess) {
            const checkPayment = async () => {
                setCheckingStatus(true);
                try {
                    const res = await fetch("/api/topup/check", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paymentId: paymentData.id }),
                    });
                    const data = await res.json();
                    if (data.status === "paid") {
                        setPaymentSuccess(true);
                        if (pollingRef.current) clearInterval(pollingRef.current);
                    }
                } catch {
                    // silently retry next interval
                } finally {
                    setCheckingStatus(false);
                }
            };

            checkPayment();
            pollingRef.current = setInterval(checkPayment, 5000);

            return () => {
                if (pollingRef.current) clearInterval(pollingRef.current);
            };
        }
    }, [paymentData, paymentSuccess]);

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

    /* ─── Create Payment ───────────────────────────────── */
    const createPayment = async (packageId?: string, customAmount?: number) => {
        setIsLoading(true);
        setPaymentError(null);

        try {
            const res = await fetch("/api/topup/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageId ? { packageId } : { customAmount: String(customAmount) }),
            });

            const data = await res.json();

            if (!data.success) {
                setPaymentError(data.error || "Gagal membuat pembayaran.");
                return;
            }

            setPaymentData({
                id: data.transaction.paymentId,
                amount: data.transaction.amount,
                expired_at: data.transaction.expiredAt || "",
                url: data.transaction.payUrl || "",
                qr_image: data.transaction.qrImage || "",
            });
        } catch {
            setPaymentError("Terjadi kesalahan jaringan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePackagePayment = (pkgId: string) => {
        setSelectedPackage(pkgId);
        createPayment(pkgId);
    };

    const handleCustomPayment = () => {
        if (typeof customNominal === "number" && customNominal >= 1000) {
            createPayment(undefined, customNominal);
        }
    };

    const closePaymentModal = () => {
        setPaymentData(null);
        setPaymentError(null);
        setCopied(false);
        setPaymentSuccess(false);
        setCheckingStatus(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const copyLink = async () => {
        if (!paymentData) return;
        await navigator.clipboard.writeText(paymentData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl font-sans min-h-screen">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight uppercase">
                        Top Up <span className="text-black inline-block -rotate-2 bg-primary px-2 border-[3px] border-black rounded-lg shadow-neo-sm">Kredit</span>
                    </h1>
                    <p className="mt-4 text-black/80 font-bold text-lg">Pilih paket yang sesuai dengan kebutuhan download-mu.</p>
                    <p className="mt-1.5 text-sm text-black/60 font-semibold italic">* Harga yang tertera belum termasuk biaya admin payment gateway.</p>
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
                                    </div>

                                    {/* Button */}
                                    <Button
                                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                                        disabled={isLoading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePackagePayment(pkg.id);
                                        }}
                                        className={`w-full h-12 text-base font-black rounded-xl transition-all duration-300 border-[3px] border-black ${selectedPackage === pkg.id
                                            ? "bg-white text-black hover:bg-black hover:text-white"
                                            : "bg-primary text-black hover:bg-primary/90 shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                                            }`}
                                    >
                                        {isLoading && selectedPackage === pkg.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            "Pilih Paket"
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
                                            handlePackagePayment(pkg.id);
                                        }}
                                        className={`w-full h-12 text-sm font-black rounded-xl transition-all duration-300 border-[3px] border-black ${selectedPackage === pkg.id
                                            ? "bg-black text-white"
                                            : "bg-white text-black hover:bg-black hover:text-white"}`}
                                    >
                                        {isLoading && selectedPackage === pkg.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            "Pilih VIP"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Custom Nominal Section */}
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
                                </div>
                            )}

                            <Button
                                className="w-full bg-primary text-black border-[3px] border-black hover:bg-primary/90 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo h-14 font-black text-lg rounded-xl shadow-neo-sm transition-all duration-300"
                                disabled={!customNominal || customNominal < 1000 || isLoading}
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
            </div>

            {/* 4. Footer Notes */}
            <div className="mt-12 pt-8 border-t-[3px] border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-black">
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border-[3px] border-black shadow-neo-sm">
                        <div className="bg-[#ffeb3b] p-3 rounded-xl border-[3px] border-black shrink-0">
                            <Zap className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <div>
                            <p className="font-black text-black mb-1 uppercase tracking-wide">Penggunaan Kredit</p>
                            <p className="font-bold text-black/80 leading-relaxed">1 Kredit = 1x Download ringan. Fitur premium (kualitas tinggi/fitur khusus) mungkin memerlukan lebih banyak kredit.</p>
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


            {/* ─── Payment Modal ────────────────────────────── */}
            <AnimatePresence>
                {(paymentData || paymentError) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={closePaymentModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="bg-white rounded-3xl shadow-neo border-[3px] border-black w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-[#ffeb3b] rounded-t-[1.3rem]">
                                <h3 className="text-xl font-black text-black uppercase tracking-wide">
                                    {paymentError ? "Pembayaran Gagal" : "Pembayaran"}
                                </h3>
                                <button
                                    onClick={closePaymentModal}
                                    className="w-10 h-10 rounded-xl bg-white border-2 border-black hover:bg-black hover:text-white flex items-center justify-center transition-colors shadow-neo-sm"
                                >
                                    <X className="w-6 h-6" strokeWidth={3} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {paymentError ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 rounded-2xl border-4 border-black bg-[#ffb3c6] flex items-center justify-center mx-auto mb-4 -rotate-3 shadow-neo-sm">
                                            <X className="w-10 h-10 text-black" strokeWidth={4} />
                                        </div>
                                        <p className="text-black font-bold text-lg mb-6 leading-relaxed">{paymentError}</p>
                                        <Button
                                            onClick={closePaymentModal}
                                            className="bg-primary text-black hover:bg-primary/90 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo font-black text-lg px-8 py-3 rounded-xl border-[3px] border-black h-14 shadow-neo-sm transition-all duration-300 w-full uppercase"
                                        >
                                            Tutup
                                        </Button>
                                    </div>
                                ) : paymentData && paymentSuccess ? (
                                    /* ─── Success State ──────────────── */
                                    <div className="text-center py-6 space-y-6">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="w-20 h-20 rounded-2xl bg-[#a0d1d6] border-[4px] border-black flex items-center justify-center mx-auto rotate-3 shadow-neo-sm"
                                        >
                                            <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none">
                                                <motion.path
                                                    d="M5 13l4 4L19 7"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                                />
                                            </svg>
                                        </motion.div>
                                        <div>
                                            <h4 className="text-2xl font-black text-black mb-2 uppercase tracking-wide">Pembayaran Berhasil!</h4>
                                            <p className="text-black/80 font-bold text-base">Kredit kamu telah ditambahkan.</p>
                                        </div>
                                        <div className="bg-white border-[3px] border-black shadow-neo-sm rounded-2xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-[#ffb3c6] border-l-[3px] border-black"></div>
                                            <p className="text-sm font-black uppercase text-black/70 mb-2 tracking-widest">Total Dibayar</p>
                                            <p className="text-3xl font-black text-black">{formatIDR(paymentData.amount)}</p>
                                        </div>
                                        <Button
                                            onClick={closePaymentModal}
                                            className="bg-primary text-black hover:bg-primary/90 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo font-black text-lg px-8 py-3 rounded-xl border-[3px] border-black h-14 shadow-neo-sm transition-all duration-300 w-full uppercase"
                                        >
                                            Selesai
                                        </Button>
                                    </div>
                                ) : paymentData ? (
                                    <div className="space-y-6">
                                        {/* Amount */}
                                        <div className="text-center">
                                            <p className="text-sm text-black/70 font-black uppercase tracking-widest mb-2">Total Pembayaran</p>
                                            <div className="inline-block bg-[#a0d1d6] px-4 py-2 border-[3px] border-black rounded-xl shadow-neo-sm -rotate-1">
                                                <p className="text-4xl font-black text-black tracking-tight">{formatIDR(paymentData.amount)}</p>
                                            </div>
                                        </div>

                                        {/* QR Code */}
                                        <div className="flex justify-center">
                                            <div className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-neo-sm rotate-1">
                                                <Image
                                                    src={paymentData.qr_image}
                                                    alt="QR Code Pembayaran"
                                                    width={180}
                                                    height={180}
                                                    className="rounded-lg"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>

                                        <p className="text-center text-sm font-bold text-black bg-[#ffeb3b] p-3 border-2 border-black rounded-xl shadow-neo-sm mx-4">
                                            Scan QR di atas menggunakan aplikasi e-wallet kamu
                                        </p>

                                        {/* Status Check Indicator */}
                                        <div className="bg-white border-[3px] border-black shadow-neo-sm rounded-xl p-5 flex flex-col items-center gap-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-[#c4b5fd] border-l-[3px] border-black"></div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-base font-black text-black uppercase tracking-wide">Menunggu pembayaran...</p>
                                            </div>
                                            {/* Spinner */}
                                            <div className="w-10 h-10 rounded-full border-[4px] border-black/20 border-t-black animate-spin" />
                                            <span className="text-xs font-black text-black/50 uppercase tracking-widest">Auto-check setiap 5 detik</span>
                                        </div>

                                        {/* Expiry */}
                                        <div className="bg-secondary/50 border border-border rounded-xl p-3 flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <p className="text-sm text-muted-foreground">
                                                Berlaku hingga: <span className="font-bold text-foreground">{paymentData.expired_at}</span>
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={copyLink}
                                                variant="outline"
                                                className="flex-1 border-2 border-border text-foreground hover:bg-secondary font-bold rounded-xl h-12"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="mr-2 w-4 h-4" />
                                                        Tersalin!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 w-4 h-4" />
                                                        Salin Link
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                asChild
                                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl h-12"
                                            >
                                                <a href={paymentData.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 w-4 h-4" />
                                                    Buka Link
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
