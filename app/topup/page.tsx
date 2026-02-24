"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Clock, ChevronRight, QrCode, ExternalLink, Loader2, X, Copy, Check, CheckCircle2, RefreshCw, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import RealtimeCredits from "@/components/RealtimeCredits";

const ADMIN_FEE_PERCENT = 7.5;
const calcAdminFee = (amount: number) => Math.ceil(amount * ADMIN_FEE_PERCENT / 100);
const calcTotal = (amount: number) => amount + calcAdminFee(amount);

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
        credits: 250,
        period: "30 Hari",
        popular: false,
    },
    {
        id: "basic",
        name: "Basic",
        price: 10000,
        credits: 750,
        period: "30 Hari",
        popular: true,
    },
    {
        id: "pro",
        name: "Pro",
        price: 25000,
        credits: 3500,
        period: "30 Hari",
        popular: false,
    },
    {
        id: "premium",
        name: "Premium",
        price: 50000,
        credits: 15000,
        period: "30 Hari",
        popular: false,
    },
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
    const [creditInfo, setCreditInfo] = useState<{ credits: number; role: string }>({ credits: 0, role: "free" });

    // Fetch real credit info on mount and after successful payment
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch("/api/user/credits");
                const data = await res.json();
                if (data.credits !== undefined) {
                    setCreditInfo({ credits: data.credits, role: data.role || "free" });
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

    const customCredits = typeof customNominal === "number" ? Math.floor((customNominal / 1000) * 50) : 0;

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
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">Top Up Kredit</h1>
                    <p className="mt-2 text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan download-mu.</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/70 italic">* Harga yang tertera belum termasuk biaya admin payment gateway.</p>
                </div>
                <Link href="/topup/history">
                    <Button
                        variant="outline"
                        className="rounded-xl border-border hover:bg-secondary font-bold gap-2 shrink-0"
                    >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Riwayat</span>
                    </Button>
                </Link>
            </div>

            {/* 1. Credit Balance Banner */}
            <div className="mb-8 p-5 md:p-6 bg-secondary/50 border border-border rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Kredit kamu saat ini</p>
                    <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-foreground fill-foreground" />
                        <span className="text-4xl font-black tracking-tighter text-foreground">
                            <RealtimeCredits initialCredits={creditInfo.credits} />
                        </span>
                    </div>
                </div>
                <div className="hidden sm:block">
                    <div className="bg-secondary rounded-full px-4 py-2 text-sm text-muted-foreground font-medium">
                        Status: <span className="text-foreground font-bold capitalize">{creditInfo.role === "premium" ? "Premium" : "Free"}</span>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                {/* 2. Pricing Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
                    {packages.map((pkg) => (
                        <motion.div
                            key={pkg.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Card
                                className={`relative h-full cursor-pointer transition-all duration-300 rounded-2xl ${selectedPackage === pkg.id
                                    ? "border-primary border-2 shadow-lg shadow-primary/10 bg-secondary/50"
                                    : "border-border hover:border-muted-foreground/30 hover:shadow-md bg-card"
                                    }`}
                                onClick={() => setSelectedPackage(pkg.id)}
                            >
                                {pkg.popular && (
                                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-3 py-0.5 font-bold text-[10px] shadow-sm whitespace-nowrap">
                                        POPULAR
                                    </Badge>
                                )}
                                <div className="p-4 sm:p-5 space-y-3">
                                    {/* Period Badge */}
                                    <Badge variant="outline" className="bg-secondary/50 border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                                        {pkg.period}
                                    </Badge>

                                    {/* Package Name */}
                                    <h3 className="font-extrabold text-foreground text-lg tracking-tight">{pkg.name}</h3>

                                    {/* Credits & Period */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Coins className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-xs font-medium">{pkg.credits.toLocaleString("id-ID")} Kredit</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-xs font-medium">{pkg.period}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="pt-1">
                                        <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{formatIDR(pkg.price)}</p>
                                    </div>

                                    {/* Button */}
                                    <Button
                                        variant={selectedPackage === pkg.id ? "default" : "outline"}
                                        disabled={isLoading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePackagePayment(pkg.id);
                                        }}
                                        className={`w-full h-9 text-sm font-bold rounded-xl transition-all duration-300 ${selectedPackage === pkg.id
                                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                            : "border border-border text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground"
                                            }`}
                                    >
                                        {isLoading && selectedPackage === pkg.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Pilih Paket"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Custom Nominal Section */}
                <div className="bg-secondary rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden group border border-border">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-muted rounded-full blur-3xl opacity-40 -mr-40 -mt-40 pointer-events-none transition-opacity duration-700 group-hover:opacity-60"></div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-block bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-md mb-4">Alternatif</div>
                            <h3 className="text-3xl font-black mb-3 tracking-tight text-foreground">Beli Nominal Custom</h3>
                            <p className="text-muted-foreground text-base mb-8 leading-relaxed">Masukkan nominal sesuai keinginanmu. Minimal Rp 1.000, kelipatan bebas.</p>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Masukkan Nominal (Rp)</label>
                                <div className="relative group/input">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold group-focus-within/input:text-foreground transition-colors">Rp</span>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={customNominal ? customNominal.toLocaleString('id-ID') : ''}
                                        onChange={handleCustomNominalChange}
                                        onBlur={handleNominalBlur}
                                        placeholder="1.000"
                                        className="pl-14 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring h-14 text-xl font-bold rounded-xl transition-all"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs font-medium uppercase tracking-widest pointer-events-none">IDR</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/50 rounded-2xl p-6 md:p-8 border border-border backdrop-blur-md shadow-inner h-full flex flex-col justify-between">
                            <div className="grid grid-cols-2 gap-4 mb-8 h-full">
                                <div className="bg-background/50 rounded-xl p-4 border border-border flex flex-col justify-center">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Total Kredit</p>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-foreground fill-foreground" />
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={customCredits}
                                                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                                transition={{ duration: 0.2 }}
                                                className="text-3xl font-black text-foreground tracking-tighter"
                                            >
                                                {customCredits > 0 ? customCredits.toLocaleString('id-ID') : "0"}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="bg-background/50 rounded-xl p-4 border border-border flex flex-col justify-center">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Masa Aktif</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        <p className="text-xl font-bold text-foreground">30 Hari</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Fee Summary */}
                            {typeof customNominal === "number" && customNominal >= 1000 && (
                                <div className="space-y-1 text-sm mb-6 bg-background/50 rounded-xl p-4 border border-border">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Nominal</span>
                                        <span>{formatIDR(customNominal)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Biaya Admin</span>
                                        <span>{formatIDR(calcAdminFee(customNominal))}</span>
                                    </div>
                                    <div className="h-px w-full bg-border my-1" />
                                    <div className="flex justify-between font-bold text-foreground text-base">
                                        <span>Total Bayar</span>
                                        <span>{formatIDR(calcTotal(customNominal))}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                                        <ChevronRight className="ml-2 w-6 h-6" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Footer Notes */}
            <div className="mt-12 pt-8 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="bg-card p-2 rounded-lg shadow-sm border border-border shrink-0">
                            <Zap className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-1">Penggunaan Kredit</p>
                            <p className="leading-relaxed">1 Kredit = 1x Download ringan. Fitur premium (kualitas tinggi/fitur khusus) mungkin memerlukan lebih banyak kredit.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border shadow-sm">
                        <div className="bg-secondary/50 p-2 rounded-lg shadow-sm border border-border shrink-0">
                            <QrCode className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-2">Metode Pembayaran</p>
                            <div className="flex flex-col gap-1.5">
                                <Badge variant="outline" className="w-fit bg-background border-border text-foreground font-bold">
                                    QRIS All Payment
                                </Badge>
                                <p className="text-xs font-medium text-muted-foreground">
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                        onClick={closePaymentModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">
                                    {paymentError ? "Pembayaran Gagal" : "Pembayaran"}
                                </h3>
                                <button
                                    onClick={closePaymentModal}
                                    className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {paymentError ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                                            <X className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-base mb-6">{paymentError}</p>
                                        <Button
                                            onClick={closePaymentModal}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-3 rounded-xl"
                                        >
                                            Tutup
                                        </Button>
                                    </div>
                                ) : paymentData && paymentSuccess ? (
                                    /* ─── Success State ──────────────── */
                                    <div className="text-center py-6 space-y-5">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto"
                                        >
                                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                                                <motion.path
                                                    d="M5 13l4 4L19 7"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                                />
                                            </svg>
                                        </motion.div>
                                        <div>
                                            <h4 className="text-xl font-black text-foreground mb-1">Pembayaran Berhasil!</h4>
                                            <p className="text-muted-foreground text-sm">Kredit kamu telah ditambahkan.</p>
                                        </div>
                                        <div className="bg-secondary/50 border border-border rounded-xl p-4">
                                            <p className="text-sm text-muted-foreground mb-1">Total Dibayar</p>
                                            <p className="text-2xl font-black text-foreground">{formatIDR(paymentData.amount)}</p>
                                        </div>
                                        <Button
                                            onClick={closePaymentModal}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 py-3 rounded-xl h-12"
                                        >
                                            Selesai
                                        </Button>
                                    </div>
                                ) : paymentData ? (
                                    <div className="space-y-5">
                                        {/* Amount */}
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Pembayaran</p>
                                            <p className="text-4xl font-black text-foreground tracking-tight">{formatIDR(paymentData.amount)}</p>
                                        </div>

                                        {/* QR Code */}
                                        <div className="flex justify-center">
                                            <div className="bg-[#ffffff] border-2 border-border rounded-2xl p-3 shadow-sm">
                                                <Image
                                                    src={paymentData.qr_image}
                                                    alt="QR Code Pembayaran"
                                                    width={160}
                                                    height={160}
                                                    className="rounded-lg"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>

                                        <p className="text-center text-sm text-muted-foreground">
                                            Scan QR di atas menggunakan aplikasi e-wallet kamu
                                        </p>

                                        {/* Status Check Indicator */}
                                        <div className="bg-secondary/50 border border-border rounded-xl p-4 flex flex-col items-center gap-3">
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm text-muted-foreground font-medium">Menunggu pembayaran...</p>
                                            </div>
                                            {/* Spinner */}
                                            <div className="w-8 h-8 rounded-full border-[3px] border-muted-foreground/20 border-t-foreground animate-spin" />
                                            <span className="text-xs text-muted-foreground/60 font-medium">Auto-check setiap 5 detik</span>
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
