"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Coins, ArrowLeft, CheckCircle, Clock, Loader2 } from "lucide-react";

const PACKAGES = [
    { id: "starter", name: "Starter", price: 5000, credits: 1500, days: 14, popular: false },
    { id: "basic", name: "Basic", price: 10000, credits: 3000, days: 14, popular: true },
    { id: "pro", name: "Pro", price: 25000, credits: 7500, days: 14, popular: false },
    { id: "premium", name: "Premium", price: 50000, credits: 15000, days: 14, popular: false },
];

function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function TopUpPage() {
    const { data: session, status } = useSession();
    const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState<{
        paymentId: string;
        qrImage: string;
        payUrl: string;
        expiredAt: string;
        credits: number;
        amount: number;
    } | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending");
    const [credits, setCredits] = useState<number>(0);

    // Fetch current credits
    useEffect(() => {
        fetch("/api/user/credits")
            .then(r => r.json())
            .then(d => setCredits(d.credits))
            .catch(() => { });
    }, [session]);

    // Create payment
    const handleCreatePayment = async (packageId: string) => {
        if (!session?.user) {
            const { showToast } = await import("@/components/Toast");
            showToast("Silakan login terlebih dahulu", "error");
            return;
        }

        setLoading(true);
        setSelectedPkg(packageId);

        try {
            const res = await fetch("/api/topup/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId }),
            });
            const data = await res.json();

            if (data.success) {
                setPayment({
                    paymentId: data.transaction.paymentId,
                    qrImage: data.transaction.qrImage,
                    payUrl: data.transaction.payUrl,
                    expiredAt: data.transaction.expiredAt,
                    credits: data.transaction.credits,
                    amount: data.transaction.amount,
                });
                setPaymentStatus("pending");
            } else {
                const { showToast } = await import("@/components/Toast");
                showToast(data.error || "Gagal membuat pembayaran", "error");
            }
        } catch {
            const { showToast } = await import("@/components/Toast");
            showToast("Terjadi kesalahan", "error");
        } finally {
            setLoading(false);
        }
    };

    // Poll payment status
    const checkPayment = useCallback(async () => {
        if (!payment || paymentStatus !== "pending") return;

        try {
            const res = await fetch("/api/topup/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: payment.paymentId }),
            });
            const data = await res.json();

            if (data.status === "paid") {
                setPaymentStatus("paid");
                setCredits(prev => prev + payment.credits);
                const { showToast } = await import("@/components/Toast");
                showToast(`+${payment.credits} kredit berhasil ditambahkan!`, "success");
            }
        } catch {
            // Silently retry
        }
    }, [payment, paymentStatus]);

    // Auto-poll every 5 seconds
    useEffect(() => {
        if (paymentStatus !== "pending" || !payment) return;
        const interval = setInterval(checkPayment, 5000);
        return () => clearInterval(interval);
    }, [checkPayment, paymentStatus, payment]);

    if (status === "loading") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-4xl px-4 py-10"
            >
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">Top Up Kredit</h1>
                    <p className="mt-2 text-neutral-400">Tambah kredit untuk terus menggunakan fitur download dan pencarian</p>
                </div>

                {/* Current credits card */}
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 ring-1 ring-amber-500/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
                            <Coins className="h-7 w-7 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-200/70">Kredit Anda Saat Ini</p>
                            <p className="text-3xl font-black text-white">{credits}</p>
                        </div>
                        {!session?.user && (
                            <div className="ml-auto">
                                <p className="text-xs text-amber-200/50">Login untuk top up</p>
                            </div>
                        )}
                    </div>
                </m.div>

                {/* Payment QR View */}
                {payment && paymentStatus !== "paid" && (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
                    >
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 text-center">
                            <h2 className="text-xl font-bold text-white">Scan QR Code untuk Membayar</h2>
                            <p className="mt-1 text-sm text-neutral-400">
                                {formatRupiah(payment.amount)} → +{payment.credits} kredit
                            </p>
                        </div>
                        <div className="flex flex-col items-center p-8">
                            {/* QR Image */}
                            <div className="rounded-2xl bg-white p-4 shadow-2xl">
                                <Image
                                    src={payment.qrImage}
                                    alt="QR Code Pembayaran"
                                    width={280}
                                    height={280}
                                    className="h-[280px] w-[280px]"
                                    unoptimized
                                />
                            </div>

                            {/* Status */}
                            <div className="mt-6 flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-amber-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm font-semibold">Menunggu pembayaran...</span>
                            </div>

                            <p className="mt-3 text-xs text-neutral-500">
                                <Clock className="mr-1 inline h-3 w-3" />
                                Kadaluarsa: {payment.expiredAt}
                            </p>

                            <div className="mt-4 flex gap-3">
                                <a
                                    href={payment.payUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-500"
                                >
                                    Buka Link Pembayaran
                                </a>
                                <button
                                    onClick={checkPayment}
                                    className="rounded-lg bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                                >
                                    Cek Status
                                </button>
                            </div>
                        </div>
                    </m.div>
                )}

                {/* Payment Success */}
                {paymentStatus === "paid" && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 rounded-2xl bg-emerald-500/10 p-8 text-center ring-1 ring-emerald-500/20"
                    >
                        <CheckCircle className="mx-auto h-16 w-16 text-emerald-400" />
                        <h2 className="mt-4 text-2xl font-black text-white">Pembayaran Berhasil!</h2>
                        <p className="mt-2 text-emerald-200/70">
                            +{payment?.credits} kredit telah ditambahkan ke akun Anda
                        </p>
                        <button
                            onClick={() => { setPayment(null); setPaymentStatus("pending"); }}
                            className="mt-6 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500"
                        >
                            Kembali ke Paket
                        </button>
                    </m.div>
                )}

                {/* Packages */}
                {!payment && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {PACKAGES.map((pkg, i) => (
                            <m.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className={`relative overflow-hidden rounded-2xl p-6 ring-1 transition hover:ring-2 cursor-pointer ${selectedPkg === pkg.id
                                        ? "bg-emerald-500/10 ring-emerald-500/50"
                                        : "bg-white/5 ring-white/10 hover:ring-white/20"
                                    }`}
                                onClick={() => !loading && handleCreatePayment(pkg.id)}
                            >
                                {pkg.popular && (
                                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                                        Popular
                                    </div>
                                )}
                                <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                                <p className="mt-1 text-3xl font-black text-emerald-400">
                                    {formatRupiah(pkg.price)}
                                </p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                                        <Coins className="h-4 w-4 text-amber-400" />
                                        <span><strong>{pkg.credits.toLocaleString()}</strong> kredit</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                                        <Clock className="h-4 w-4 text-blue-400" />
                                        <span>Masa aktif <strong>{pkg.days} hari</strong></span>
                                    </div>
                                </div>
                                <button
                                    disabled={loading}
                                    className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                                >
                                    {loading && selectedPkg === pkg.id ? (
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    ) : (
                                        "Pilih Paket"
                                    )}
                                </button>
                            </m.div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 rounded-xl bg-white/5 p-4 text-xs text-neutral-500 ring-1 ring-white/10">
                    <p>💡 Setiap aksi download atau pencarian menggunakan <strong>1 kredit</strong>. Akun baru mendapat <strong>100 kredit gratis</strong>.</p>
                    <p className="mt-1">💳 Pembayaran melalui QRIS (GoPay, OVO, Dana, ShopeePay, dll).</p>
                </div>
            </m.div>
        </LazyMotion>
    );
}
