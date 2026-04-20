"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Check, Copy, Clock, QrCode, Loader2, AlertCircle, ExternalLink, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types ───────────────────────────────────────────── */
interface CheckoutData {
    paymentId: string;
    amount: number;
    serviceName: string;
    channelCategory: "va" | "qris" | "ewallet";
    qrImage: string;
    vaNumber: string;
    payUrl: string;
    checkoutUrl: string;
    expiredAt: string;
    baseAmount: number;
    appFee: number;
}

const SESSION_KEY = "inversave_checkout_";

const EXPIRE_MS = 30 * 60 * 1000; // 30 menit countdown maks

function formatIDR(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatCountdown(ms: number) {
    if (ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const s = String(totalSecs % 60).padStart(2, "0");
    return `${m}:${s}`;
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    void searchParams; // kept for potential future use

    const lang = (typeof params.lang === "string" ? params.lang : params.lang?.[0]) || "id";
    const paymentId = typeof params.paymentId === "string" ? params.paymentId : params.paymentId?.[0] || "";

    const [data, setData] = useState<CheckoutData | null>(null);
    const [status, setStatus] = useState<"pending" | "paid" | "failed" | "loading">("loading");
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(EXPIRE_MS);
    const [notFound, setNotFound] = useState(false);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const createdAtRef = useRef<number>(Date.now());

    /* ─── Load data from sessionStorage ───────────────── */
    useEffect(() => {
        if (!paymentId) { setNotFound(true); return; }
        const raw = sessionStorage.getItem(SESSION_KEY + paymentId);
        if (!raw) { setNotFound(true); return; }
        try {
            const parsed: CheckoutData & { createdAt?: number } = JSON.parse(raw);
            setData(parsed);
            setStatus("pending");
            if (parsed.createdAt) {
                createdAtRef.current = parsed.createdAt;
                const elapsed = Date.now() - parsed.createdAt;
                setTimeLeft(Math.max(0, EXPIRE_MS - elapsed));
            }
        } catch {
            setNotFound(true);
        }
    }, [paymentId]);

    /* ─── Countdown timer ─────────────────────────────── */
    useEffect(() => {
        if (status !== "pending") return;
        countdownRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    clearInterval(countdownRef.current!);
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current!);
    }, [status]);

    /* ─── Poll payment status ─────────────────────────── */
    useEffect(() => {
        if (!paymentId || status !== "pending") return;

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/topup/check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId }),
                });
                const result = await res.json();
                if (result.status === "paid") {
                    setStatus("paid");
                    clearInterval(pollingRef.current!);
                    clearInterval(countdownRef.current!);
                    sessionStorage.removeItem(SESSION_KEY + paymentId);
                    // Redirect to topup page with success param after 2s
                    setTimeout(() => {
                        router.replace(`/${lang}/topup?paid=1`);
                    }, 2500);
                } else if (result.status === "failed") {
                    setStatus("failed");
                    clearInterval(pollingRef.current!);
                    clearInterval(countdownRef.current!);
                }
            } catch {
                /* silently retry */
            }
        };

        checkStatus();
        pollingRef.current = setInterval(checkStatus, 5000);
        return () => clearInterval(pollingRef.current!);
    }, [paymentId, status, lang, router]);

    /* ─── Copy helper ─────────────────────────────────── */
    const copyText = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* ─── Not found ───────────────────────────────────── */
    if (notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#fffdf7]">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 bg-[#ffb3c6] border-[4px] border-black rounded-2xl flex items-center justify-center mx-auto rotate-3 shadow-neo">
                        <AlertCircle className="w-10 h-10 text-black" strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">Transaksi Tidak Ditemukan</h2>
                    <p className="font-bold text-black/70">Data pembayaran tidak ditemukan atau sudah kedaluwarsa.</p>
                    <Button
                        onClick={() => router.push(`/${lang}/topup`)}
                        className="bg-black text-white border-[3px] border-black font-black rounded-xl h-12 px-8"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Kembali ke Topup
                    </Button>
                </div>
            </div>
        );
    }

    /* ─── Loading ─────────────────────────────────────── */
    if (status === "loading" || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
                <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
        );
    }

    /* ─── Paid success ────────────────────────────────── */
    if (status === "paid") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#fffdf7]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    className="text-center space-y-6 max-w-sm"
                >
                    <div className="w-24 h-24 bg-[#a0d1d6] border-[4px] border-black rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-neo">
                        <Check className="w-14 h-14 text-black" strokeWidth={4} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-black uppercase tracking-tight">Pembayaran Berhasil!</h2>
                        <p className="font-bold text-black/70 mt-2">Paket VIP kamu sudah aktif. Mengalihkan...</p>
                    </div>
                    <div className="bg-white border-[3px] border-black rounded-2xl p-5 shadow-neo-sm">
                        <p className="text-xs font-black uppercase text-black/50 tracking-widest mb-1">Total Dibayar</p>
                        <p className="text-3xl font-black text-black">{formatIDR(data.amount)}</p>
                    </div>
                    <Loader2 className="w-6 h-6 animate-spin text-black mx-auto opacity-50" />
                </motion.div>
            </div>
        );
    }

    /* ─── Failed / expired ────────────────────────────── */
    if (status === "failed" || timeLeft === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#fffdf7]">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 bg-[#ffb3c6] border-[4px] border-black rounded-2xl flex items-center justify-center mx-auto -rotate-3 shadow-neo">
                        <AlertCircle className="w-10 h-10 text-black" strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-black text-black uppercase">
                        {timeLeft === 0 ? "Waktu Habis" : "Pembayaran Gagal"}
                    </h2>
                    <p className="font-bold text-black/70">Buat transaksi baru dari halaman topup.</p>
                    <Button
                        onClick={() => router.push(`/${lang}/topup`)}
                        className="bg-black text-white border-[3px] border-black font-black rounded-xl h-12 px-8 w-full"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" /> Kembali ke Topup
                    </Button>
                </div>
            </div>
        );
    }

    /* ─── Pending ─────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#fffdf7] py-8 px-4">
            <div className="max-w-lg mx-auto space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/${lang}/topup`)}
                        className="w-10 h-10 rounded-xl bg-white border-[3px] border-black hover:bg-[#f0f0f0] flex items-center justify-center transition-colors shadow-neo-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-black" strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-black uppercase tracking-tight">Halaman Pembayaran</h1>
                        <p className="text-xs font-black text-black/50 uppercase tracking-widest">{data.serviceName}</p>
                    </div>
                </div>

                {/* Amount card */}
                <div className="bg-[#a0d1d6] border-[3px] border-black rounded-3xl p-6 shadow-neo text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-2">Total Pembayaran</p>
                    <p className="text-5xl font-black text-black tracking-tight">{formatIDR(data.amount)}</p>
                    {!!data.baseAmount && !!data.appFee && (
                        <div className="mt-4 flex items-center justify-center gap-6 text-sm font-bold text-black/70">
                            <span>Paket {formatIDR(data.baseAmount)}</span>
                            <span>+</span>
                            <span>Fee {formatIDR(data.appFee)}</span>
                        </div>
                    )}
                </div>

                {/* Countdown */}
                <div className="bg-white border-[3px] border-black rounded-2xl px-6 py-4 shadow-neo-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-black" strokeWidth={3} />
                        <span className="font-black text-black uppercase text-sm tracking-wide">Batas Waktu</span>
                    </div>
                    <span className={`text-2xl font-black tabular-nums tracking-tight ${timeLeft < 180000 ? "text-red-600" : "text-black"}`}>
                        {formatCountdown(timeLeft)}
                    </span>
                </div>

                {/* ── QRIS: show QR Code ── */}
                {data.channelCategory === "qris" && data.qrImage && (
                    <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-neo space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <QrCode className="w-5 h-5" strokeWidth={3} />
                            <h2 className="font-black text-black uppercase tracking-wide text-sm">Scan QR Code</h2>
                        </div>

                        <div className="flex justify-center">
                            <div className="bg-white border-[4px] border-black rounded-2xl p-4 shadow-neo">
                                <Image
                                    src={data.qrImage}
                                    alt="QR Code Pembayaran"
                                    width={260}
                                    height={260}
                                    className="rounded-xl"
                                    unoptimized
                                />
                            </div>
                        </div>

                        <div className="bg-[#ffeb3b] border-[3px] border-black rounded-2xl p-4 text-sm font-bold text-black space-y-1">
                            <p className="font-black uppercase tracking-wide mb-2">🧭 Cara Bayar:</p>
                            <p>1. Screenshot QR di atas</p>
                            <p>2. Buka DANA / GoPay / OVO / ShopeePay / LinkAja</p>
                            <p>3. Pilih <strong>Scan QR</strong> → pilih dari galeri foto</p>
                            <p>4. Pastikan nominal sesuai, lalu selesaikan pembayaran</p>
                            <p>5. Halaman ini otomatis refresh saat pembayaran diterima ✅</p>
                        </div>
                    </div>
                )}

                {/* ── QRIS Realtime: no QR → direct link ── */}
                {data.channelCategory === "qris" && !data.qrImage && data.payUrl && (
                    <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-neo space-y-4">
                        <div className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" strokeWidth={3} />
                            <h2 className="font-black text-black uppercase tracking-wide text-sm">QRIS {data.serviceName}</h2>
                        </div>
                        <p className="text-sm font-bold text-black/70">QR tersedia di halaman pembayaran. Klik tombol di bawah untuk membuka.</p>
                        <a
                            href={data.payUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-black text-white border-[3px] border-black rounded-xl h-12 font-black hover:bg-black/80 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Buka Halaman QR
                        </a>
                    </div>
                )}

                {/* ── VA: show number ── */}
                {data.channelCategory === "va" && data.vaNumber && (
                    <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-neo space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-black/60">Nomor Virtual Account</p>
                        <p className="text-3xl font-black text-black tracking-widest font-mono break-all">{data.vaNumber}</p>
                        <p className="text-sm font-bold text-black/70">
                            Transfer dari m-banking / ATM ke nomor VA di atas. Pembayaran otomatis terdeteksi dalam beberapa menit.
                        </p>
                        <Button
                            onClick={() => copyText(data.vaNumber)}
                            className="w-full bg-[#ffeb3b] text-black border-[3px] border-black font-black rounded-xl h-12 hover:bg-[#ffe01a] hover:-translate-y-1 hover:shadow-neo transition-all"
                        >
                            {copied ? <><Check className="mr-2 w-4 h-4" />Tersalin!</> : <><Copy className="mr-2 w-4 h-4" />Salin Nomor VA</>}
                        </Button>
                    </div>
                )}

                {/* ── E-Wallet: checkout button ── */}
                {data.channelCategory === "ewallet" && (
                    <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-neo space-y-4">
                        <p className="text-sm font-bold text-black/70 text-center">
                            Kamu akan diarahkan ke aplikasi <strong>{data.serviceName}</strong> untuk menyelesaikan pembayaran.
                        </p>
                        <a
                            href={data.checkoutUrl || data.payUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-black text-white border-[3px] border-black rounded-xl h-12 font-black hover:bg-black/80 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Bayar dengan {data.serviceName}
                        </a>
                    </div>
                )}

                {/* ── Status polling indicator ── */}
                <div className="bg-white border-[3px] border-black rounded-2xl p-5 shadow-neo-sm flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-[4px] border-black/20 border-t-black animate-spin" />
                    <p className="text-sm font-black text-black uppercase tracking-widest">Menunggu pembayaran...</p>
                    <p className="text-xs font-bold text-black/40">Auto-refresh setiap 5 detik</p>
                </div>

                {/* Transaction ID */}
                <div className="text-center">
                    <p className="text-xs font-bold text-black/40 font-mono">ID: {paymentId}</p>
                </div>
            </div>
        </div>
    );
}
