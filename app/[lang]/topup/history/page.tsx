"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    CreditCard,
    Hash,
    History,
    Instagram,
    Loader2,
    Mail,
    MessageCircle,
    X,
    XCircle,
    Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TransactionRecord {
    id: string;
    paymentId: string;
    amount: number;
    credits: number;
    status: string;
    createdAt: string;
    payUrl?: string | null;
    qrImage?: string | null;
}

function formatIDR(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function formatFullDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
    const [checkMessage, setCheckMessage] = useState("Menunggu pembayaran...");
    const [remainingMs, setRemainingMs] = useState(0);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/topup/history");
                const data = await res.json();
                if (data.transactions) setTransactions(data.transactions);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const paidCount = transactions.filter((t) => t.status === "paid").length;
    const pendingCount = transactions.filter((t) => t.status === "pending").length;
    const totalSpent = transactions
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0);

    const updateTransactionStatus = (id: string, status: string) => {
        setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, status } : tx)));
        setSelectedTx((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    };

    useEffect(() => {
        if (!selectedTx || selectedTx.status !== "pending") {
            setCheckMessage("Menunggu pembayaran...");
            setRemainingMs(0);
            return;
        }

        const createdMs = new Date(selectedTx.createdAt).getTime();
        const expiresAt = createdMs + 15 * 60 * 1000;
        const tick = () => {
            const diff = Math.max(0, expiresAt - Date.now());
            setRemainingMs(diff);
        };

        tick();
        const timer = setInterval(tick, 1000);

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/topup/check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId: selectedTx.paymentId }),
                });

                const data = await res.json();
                if (data.status === "paid") {
                    updateTransactionStatus(selectedTx.id, "paid");
                    setCheckMessage("Pembayaran terkonfirmasi!");
                } else if (data.status === "failed") {
                    updateTransactionStatus(selectedTx.id, "failed");
                    setCheckMessage(
                        data.message || "Waktu pembayaran habis, silakan buat transaksi baru."
                    );
                } else {
                    setCheckMessage(data.message || "Menunggu pembayaran...");
                }
            } catch {
                setCheckMessage("Gagal mengecek status, mencoba lagi...");
            }
        };

        checkStatus();
        const interval = setInterval(() => {
            if (Date.now() > expiresAt) {
                updateTransactionStatus(selectedTx.id, "failed");
                setCheckMessage("Waktu pembayaran habis, silakan buat transaksi baru.");
                return;
            }
            checkStatus();
        }, 5000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [selectedTx]);

    return (
        <div className="min-h-screen bg-[#f3f4ff] font-sans">
            <div className="max-w-5xl mx-auto px-4 py-10 relative">
                <div className="absolute inset-0 -z-10 opacity-70 pointer-events-none [background-image:radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.14),transparent_25%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_30%_80%,rgba(251,191,36,0.12),transparent_22%)]" />

                <div className="mb-10 overflow-hidden rounded-[26px] border-[3px] border-black bg-gradient-to-r from-[#fef9c3] via-white to-[#99f6e4] shadow-[12px_12px_0_#0f172a] relative">
                    <div className="absolute -top-3 -left-3 bg-black text-white text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full rotate-[-3deg] shadow-[6px_6px_0_#0f172a]">
                        Neo Top Up
                    </div>
                    <div className="flex flex-col gap-6 p-6 sm:p-8">
                        <div className="flex items-center gap-4 flex-wrap">
                            <Link href="/topup">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full border-[3px] border-black bg-white text-black shadow-[6px_6px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-[3px] border-black bg-black text-white text-xs font-bold uppercase shadow-[6px_6px_0_#0f172a]">
                                    <Zap className="w-4 h-4" />
                                    Quick History
                                </div>
                                <h1 className="mt-3 text-3xl sm:text-4xl font-black text-black leading-tight">
                                    Riwayat Pembelian VIP
                                </h1>
                                <p className="text-sm sm:text-base text-slate-700 max-w-2xl">
                                    Pantau semua transaksi pembelian paket VIP kamu dengan tampilan neo-brutalist yang tebal dan jelas.
                                </p>
                            </div>
                        </div>

                        {!loading && transactions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-[8px_8px_0_#0f172a]">
                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-600">
                                        Total Transaksi
                                    </p>
                                    <p className="text-3xl font-black text-black mt-1">
                                        {transactions.length}
                                    </p>
                                </div>
                                <div className="rounded-2xl border-[3px] border-black bg-[#dcfce7] p-4 shadow-[8px_8px_0_#0f172a]">
                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                                        Berhasil
                                    </p>
                                    <p className="text-3xl font-black text-emerald-700 mt-1">
                                        {paidCount}
                                    </p>
                                </div>
                                <div className="rounded-2xl border-[3px] border-black bg-[#fff7ed] p-4 shadow-[8px_8px_0_#0f172a]">
                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-700">
                                        Pending
                                    </p>
                                    <p className="text-3xl font-black text-amber-700 mt-1">
                                        {pendingCount}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!loading && totalSpent > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[3px] border-black bg-[#ecfeff] px-5 py-4 shadow-[8px_8px_0_#0f172a]">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl border-[3px] border-black bg-white flex items-center justify-center shadow-[4px_4px_0_#0f172a]">
                                        <CreditCard className="w-5 h-5 text-sky-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                                            Total Pengeluaran
                                        </p>
                                        <p className="text-2xl font-black text-black mt-1">
                                            {formatIDR(totalSpent)}
                                        </p>
                                    </div>
                                </div>
                                <Badge className="border-[3px] border-black bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.18em] shadow-[6px_6px_0_#0f172a]">
                                    Fresh recap
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-[28px] border-[3px] border-dashed border-black bg-white shadow-[10px_10px_0_#0f172a]">
                        <Loader2 className="w-8 h-8 animate-spin text-black mb-3" />
                        <p className="text-sm font-semibold text-slate-700">Memuat riwayat...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-16 px-6 rounded-[28px] border-[3px] border-black bg-gradient-to-b from-white to-[#fef9c3] shadow-[10px_10px_0_#0f172a]">
                        <div className="w-16 h-16 rounded-2xl border-[3px] border-black bg-white flex items-center justify-center mx-auto mb-5 shadow-[6px_6px_0_#0f172a]">
                            <History className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-xl font-black text-black mb-1">Belum ada riwayat</p>
                        <p className="text-sm text-slate-700 mb-6">
                            Transaksi top up kamu akan muncul di sini.
                        </p>
                        <Link href="/topup">
                            <Button className="bg-black text-white hover:bg-slate-900 font-black rounded-xl px-6 py-6 border-[3px] border-black shadow-[6px_6px_0_#0f172a]">
                                <Zap className="w-4 h-4 mr-2" />
                                Top Up Sekarang
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx, i) => {
                            const isPaid = tx.status === "paid";
                            const isFailed = tx.status === "failed";
                            const txMainLabel = tx.credits > 0
                                ? `+${tx.credits.toLocaleString("id-ID")} Kredit`
                                : "Paket VIP Unlimited";
                            const txSubLabel = tx.credits > 0 ? "Kredit" : "VIP";

                            return (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelectedTx(tx)}
                                    className="group cursor-pointer rounded-2xl border-[3px] border-black bg-white p-4 sm:p-5 flex items-center justify-between gap-4 shadow-[8px_8px_0_#0f172a] hover:-translate-y-1 hover:shadow-[12px_12px_0_#0f172a] transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className={`w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:-rotate-3 ${isPaid
                                                ? "bg-[#dcfce7]"
                                                : isFailed
                                                    ? "bg-[#fee2e2]"
                                                    : "bg-[#fff7ed]"
                                                }`}
                                        >
                                            {isPaid ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            ) : isFailed ? (
                                                <XCircle className="w-5 h-5 text-rose-600" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-black">
                                                    {txMainLabel} {" "}
                                                    <span className="text-slate-600 font-semibold">{txSubLabel}</span>
                                                </span>
                                                <Badge
                                                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border-[3px] border-black ${isPaid
                                                        ? "bg-[#22c55e] text-white"
                                                        : isFailed
                                                            ? "bg-[#ef4444] text-white"
                                                            : "bg-[#f97316] text-white"
                                                        } shadow-[4px_4px_0_#0f172a]`}
                                                >
                                                    {isPaid ? "Berhasil" : isFailed ? "Gagal" : "Pending"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1 font-semibold">
                                                {formatDate(tx.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-base sm:text-lg font-black text-black">
                                            {formatIDR(tx.amount)}
                                        </p>
                                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}


                {!loading && transactions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 rounded-[28px] border-[3px] border-black bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-6 sm:p-8 shadow-[12px_12px_0_#0f172a] mb-8"
                    >
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="text-center md:text-left">
                                <h3 className="text-xl sm:text-2xl font-black text-black mb-2 tracking-tight">
                                    Kendala Topup?
                                </h3>
                                <p className="text-sm font-semibold text-slate-700 max-w-lg">
                                    Jangan khawatir! Tim support kami siap membantu menyelesaikan masalah transaksi kamu. Hubungi kami melalui salah satu jalur di bawah.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-end gap-3 shrink-0">
                                <a
                                    href="https://wa.me/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-4 py-3 rounded-xl border-[3px] border-black bg-[#25D366] text-white font-black text-sm shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                    title="Hubungi via WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    WhatsApp
                                </a>
                                <a
                                    href="https://instagram.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-4 py-3 rounded-xl border-[3px] border-black bg-[#E1306C] text-white font-black text-sm shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                    title="Hubungi via Instagram"
                                >
                                    <Instagram className="w-4 h-4 mr-2" />
                                    Instagram
                                </a>
                                <a
                                    href="mailto:support@domainanda.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-4 py-3 rounded-xl border-[3px] border-black bg-black text-white font-black text-sm shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                    title="Hubungi via Email"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {selectedTx && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                            onClick={() => setSelectedTx(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 60, scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 30,
                                }}
                                className="w-full max-w-md sm:max-w-2xl flex flex-col max-h-[85vh] rounded-[26px] border-[3px] border-black bg-white shadow-[16px_16px_0_#0f172a] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative p-4 sm:p-5 sm:pb-4 bg-gradient-to-br from-[#ecfeff] via-white to-[#fef9c3] border-b-[3px] border-black shrink-0">
                                    <button
                                        onClick={() => setSelectedTx(null)}
                                        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full border-[3px] border-black bg-white text-black flex items-center justify-center shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                    >
                                        <X className="w-4 h-4 text-black" />
                                    </button>

                                    <div className="flex flex-col items-center text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 20,
                                                delay: 0.1,
                                            }}
                                            className={`w-12 h-12 rounded-2xl border-[3px] border-black flex items-center justify-center mb-3 shadow-[6px_6px_0_#0f172a] ${selectedTx.status === "paid"
                                                ? "bg-[#dcfce7]"
                                                : selectedTx.status === "failed"
                                                    ? "bg-[#fee2e2]"
                                                    : "bg-[#fff7ed]"
                                                }`}
                                        >
                                            {selectedTx.status === "paid" ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                            ) : selectedTx.status === "failed" ? (
                                                <XCircle className="w-6 h-6 text-rose-600" />
                                            ) : (
                                                <Clock className="w-6 h-6 text-amber-600" />
                                            )}
                                        </motion.div>

                                        <Badge
                                            className={`text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border-[3px] border-black mb-2 shadow-[4px_4px_0_#0f172a] ${selectedTx.status === "paid"
                                                ? "bg-[#22c55e] text-white"
                                                : selectedTx.status === "failed"
                                                    ? "bg-[#ef4444] text-white"
                                                    : "bg-[#f97316] text-white"
                                                }`}
                                        >
                                            {selectedTx.status === "paid"
                                                ? "Pembayaran Berhasil"
                                                : selectedTx.status === "failed"
                                                    ? "Pembayaran Gagal"
                                                    : "Menunggu Pembayaran"}
                                        </Badge>

                                        <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                                            {formatIDR(selectedTx.amount)}
                                        </p>
                                        {selectedTx.status === "pending" && remainingMs > 0 && (
                                            <p className="mt-1 text-xs font-black tracking-[0.2em] text-slate-700">
                                                Selesaikan dalam {Math.floor(remainingMs / 60000)}:{String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col sm:flex-row gap-6 max-h-[60vh] overflow-y-auto">
                                    {selectedTx.status === "pending" && selectedTx.qrImage && (
                                        <div className="shrink-0 sm:w-[280px]">
                                            <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-[8px_8px_0_#0f172a] text-center sticky top-0">
                                                <p className="text-sm font-black text-slate-700 mb-3">Scan QR untuk membayar</p>
                                                <div className="mx-auto w-36 h-36 sm:w-48 sm:h-48 rounded-xl border-[3px] border-black overflow-hidden bg-white shadow-[4px_4px_0_#0f172a]">
                                                    <Image
                                                        src={selectedTx.qrImage}
                                                        alt="QR Pembayaran"
                                                        width={192}
                                                        height={192}
                                                        className="w-full h-full object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                                {selectedTx.payUrl && (
                                                    <a
                                                        href={selectedTx.payUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-center mt-4 px-3 py-2.5 rounded-xl border-[3px] border-black bg-black text-white text-[13px] font-black shadow-[4px_4px_0_#0f172a] hover:-translate-y-0.5 transition-transform"
                                                    >
                                                        Buka Link Pembayaran
                                                    </a>
                                                )}
                                                <p className="mt-3 text-xs text-slate-700 font-semibold">{checkMessage}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="bg-white rounded-2xl border-[3px] border-black divide-y-[3px] divide-black overflow-hidden shadow-[8px_8px_0_#0f172a]">
                                            <div className="flex items-center gap-4 px-4 py-3.5">
                                                <div className="w-10 h-10 rounded-lg border-[3px] border-black bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0_#0f172a]">
                                                    <Coins className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-600 font-semibold">Detail Paket</p>
                                                    <p className="font-black text-black">
                                                        {selectedTx.credits > 0
                                                            ? `+${selectedTx.credits.toLocaleString("id-ID")} Kredit`
                                                            : "Paket VIP Unlimited"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 px-4 py-3.5">
                                                <div className="w-10 h-10 rounded-lg border-[3px] border-black bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0_#0f172a]">
                                                    <CreditCard className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-600 font-semibold">Nominal Pembayaran</p>
                                                    <p className="font-black text-black">{formatIDR(selectedTx.amount)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 px-4 py-3.5">
                                                <div className="w-10 h-10 rounded-lg border-[3px] border-black bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0_#0f172a]">
                                                    <Calendar className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-600 font-semibold">Tanggal Transaksi</p>
                                                    <p className="font-black text-black text-sm">{formatFullDate(selectedTx.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 px-4 py-3.5">
                                                <div className="w-10 h-10 rounded-lg border-[3px] border-black bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0_#0f172a]">
                                                    <Hash className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-600 font-semibold">ID Transaksi</p>
                                                    <p className="font-black text-black text-xs font-mono truncate">{selectedTx.paymentId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => setSelectedTx(null)}
                                            className="w-full mt-6 h-12 rounded-xl border-[3px] border-black bg-black text-white font-black shadow-[8px_8px_0_#0f172a] hover:-translate-y-0.5 transition-transform shrink-0"
                                        >
                                            Tutup
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
