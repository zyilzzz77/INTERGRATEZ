"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Coins,
    Calendar,
    CreditCard,
    Hash,
    Loader2,
    History,
    X,
    Zap,
    ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────── */
interface TransactionRecord {
    id: string;
    paymentId: string;
    amount: number;
    credits: number;
    status: string;
    createdAt: string;
}

/* ─── Helpers ────────────────────────────────────────── */
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

/* ─── Component ──────────────────────────────────────── */
export default function HistoryPage() {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

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

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl font-sans min-h-screen">
            {/* ─── Header ─────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/topup">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-border hover:bg-secondary shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
                        Riwayat Pembelian
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Semua transaksi top up kredit kamu
                    </p>
                </div>
            </div>

            {/* ─── Stats Cards ────────────────────────────── */}
            {!loading && transactions.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Total
                        </p>
                        <p className="text-2xl font-black text-foreground tracking-tight">
                            {transactions.length}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                            Berhasil
                        </p>
                        <p className="text-2xl font-black text-emerald-500 tracking-tight">
                            {paidCount}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
                            Pending
                        </p>
                        <p className="text-2xl font-black text-amber-500 tracking-tight">
                            {pendingCount}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Total Spent ────────────────────────────── */}
            {!loading && totalSpent > 0 && (
                <div className="mb-8 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/15 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Pengeluaran
                            </p>
                            <p className="text-xl font-black text-foreground tracking-tight">
                                {formatIDR(totalSpent)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Transaction List ──────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5">
                        <History className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold text-foreground mb-1">
                        Belum ada riwayat
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Transaksi top up kamu akan muncul di sini
                    </p>
                    <Link href="/topup">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl px-6">
                            <Zap className="w-4 h-4 mr-2" />
                            Top Up Sekarang
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx, i) => {
                        const isPaid = tx.status === "paid";

                        return (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => setSelectedTx(tx)}
                                className="group cursor-pointer bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                {/* Left side */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <div
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isPaid
                                                ? "bg-emerald-500/15"
                                                : "bg-amber-500/15"
                                            }`}
                                    >
                                        {isPaid ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-foreground">
                                                +{tx.credits.toLocaleString("id-ID")}{" "}
                                                <span className="text-muted-foreground font-medium">
                                                    Kredit
                                                </span>
                                            </span>
                                            <Badge
                                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-0 ${isPaid
                                                        ? "bg-emerald-500/15 text-emerald-500"
                                                        : "bg-amber-500/15 text-amber-500"
                                                    }`}
                                            >
                                                {isPaid ? "Berhasil" : "Pending"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDate(tx.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Right side */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <p className="text-sm font-bold text-foreground">
                                        {formatIDR(tx.amount)}
                                    </p>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ─── Detail Modal ──────────────────────────── */}
            <AnimatePresence>
                {selectedTx && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
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
                            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="relative p-6 pb-5">
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    {/* Status Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                            delay: 0.1,
                                        }}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${selectedTx.status === "paid"
                                                ? "bg-emerald-500/15"
                                                : "bg-amber-500/15"
                                            }`}
                                    >
                                        {selectedTx.status === "paid" ? (
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        ) : (
                                            <Clock className="w-8 h-8 text-amber-500" />
                                        )}
                                    </motion.div>

                                    <Badge
                                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border-0 mb-3 ${selectedTx.status === "paid"
                                                ? "bg-emerald-500/15 text-emerald-500"
                                                : "bg-amber-500/15 text-amber-500"
                                            }`}
                                    >
                                        {selectedTx.status === "paid"
                                            ? "Pembayaran Berhasil"
                                            : "Menunggu Pembayaran"}
                                    </Badge>

                                    <p className="text-3xl font-black text-foreground tracking-tight">
                                        {formatIDR(selectedTx.amount)}
                                    </p>
                                </div>
                            </div>

                            {/* Detail Rows */}
                            <div className="px-6 pb-6">
                                <div className="bg-secondary/50 rounded-2xl border border-border divide-y divide-border overflow-hidden">
                                    {/* Credits */}
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                                            <Coins className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Jumlah Kredit
                                            </p>
                                            <p className="font-bold text-foreground">
                                                +{selectedTx.credits.toLocaleString("id-ID")}{" "}
                                                Kredit
                                            </p>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                                            <CreditCard className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Nominal Pembayaran
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {formatIDR(selectedTx.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                                            <Calendar className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Tanggal Transaksi
                                            </p>
                                            <p className="font-bold text-foreground text-sm">
                                                {formatFullDate(selectedTx.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction ID */}
                                    <div className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                                            <Hash className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                ID Transaksi
                                            </p>
                                            <p className="font-bold text-foreground text-xs font-mono truncate">
                                                {selectedTx.paymentId}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <Button
                                    onClick={() => setSelectedTx(null)}
                                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl h-12"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
