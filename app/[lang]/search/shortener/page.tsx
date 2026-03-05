"use client";

import { useState, useRef } from "react";
import { Copy, Check, Loader2, Link2, ExternalLink } from "lucide-react";
import { showToast } from "@/components/Toast";

export default function ShortenerPage() {
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<{
        origin: string;
        url: string;
        code: string;
        expired_at: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleShorten = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setCopied(false);

        try {
            showToast("Mempersingkat URL...", "info");
            const res = await fetch(
                `/api/tools/shortener?url=${encodeURIComponent(url.trim())}`
            );
            const data = await res.json();

            if (!data.status) {
                setError(data.error || "Gagal mempersingkat URL");
                showToast(data.error || "Gagal mempersingkat URL", "error");
                return;
            }

            setResult({
                origin: data.origin,
                url: data.url,
                code: data.code,
                expired_at: data.expired_at,
            });
            showToast("URL berhasil dipersingkat", "success");
        } catch {
            setError("Terjadi kesalahan. Coba lagi.");
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) handleShorten();
    };

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.url);
            setCopied(true);
            showToast("URL tersalin ke clipboard", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const input = document.createElement("input");
            input.value = result.url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            showToast("URL tersalin", "success");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setUrl("");
        setResult(null);
        setError(null);
        setCopied(false);
        inputRef.current?.focus();
    };

    const formatExpiry = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg shadow-indigo-500/20">
                    <Link2 className="w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    URL{" "}
                    <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        Shortener
                    </span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Persingkat URL panjang jadi link pendek yang mudah dibagikan
                </p>
            </div>

            {/* Input Area */}
            <div className="mx-auto max-w-xl mb-8">
                <div className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Paste URL panjang di sini..."
                        disabled={loading}
                        className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 disabled:opacity-50"
                    />
                    <button
                        onClick={handleShorten}
                        disabled={loading || !url.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                        {loading ? "Proses..." : "Shorten"}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-auto max-w-xl mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && !loading && (
                <div className="mx-auto max-w-xl space-y-6">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                Link Pendek
                            </span>
                        </div>

                        {/* Short URL */}
                        <div className="mb-4 flex items-center gap-3 rounded-xl bg-neutral-950 p-4">
                            <span className="flex-1 text-base font-bold text-indigo-400 truncate select-all">
                                {result.url}
                            </span>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shrink-0 ${copied
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg bg-neutral-950 px-4 py-3">
                                <span className="text-xs font-bold text-neutral-500 shrink-0 mt-0.5">URL Asli</span>
                                <span className="text-xs text-neutral-400 break-all">{result.origin}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-neutral-950 px-4 py-3">
                                <span className="text-xs font-bold text-neutral-500 shrink-0">Kode</span>
                                <span className="text-xs text-neutral-400 font-mono">{result.code}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-neutral-950 px-4 py-3">
                                <span className="text-xs font-bold text-neutral-500 shrink-0">Kadaluarsa</span>
                                <span className="text-xs text-neutral-400">{formatExpiry(result.expired_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Buka Link
                        </a>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-3 text-sm font-bold text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                        >
                            <Link2 className="h-4 w-4" />
                            Shorten Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
