"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Download, Loader2, Sparkles, ImagePlus } from "lucide-react";
import { showToast } from "@/components/Toast";

export default function TeksToImagesPage() {
    const [prompt, setPrompt] = useState("");
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultPrompt, setResultPrompt] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setResultUrl(null);
        setResultPrompt(null);

        try {
            showToast("Generating gambar...", "info");
            const res = await fetch(
                `/api/tools/tekstoimages?q=${encodeURIComponent(prompt.trim())}`
            );
            const data = await res.json();

            if (!data.status) {
                setError(data.error || "Gagal generate gambar");
                showToast(data.error || "Gagal generate gambar", "error");
                return;
            }

            setResultUrl(data.url);
            setResultPrompt(data.prompt);
            showToast("Gambar berhasil digenerate", "success");
        } catch {
            setError("Terjadi kesalahan. Coba lagi.");
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) handleGenerate();
    };

    const handleDownload = async () => {
        if (!resultUrl) return;
        try {
            showToast("Mengunduh gambar...", "info");
            const res = await fetch(resultUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ai-image-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Gambar berhasil diunduh", "success");
        } catch {
            showToast("Membuka gambar di tab baru...", "info");
            window.open(resultUrl, "_blank");
        }
    };

    const handleReset = () => {
        setPrompt("");
        setResultUrl(null);
        setResultPrompt(null);
        setError(null);
        inputRef.current?.focus();
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-2xl text-white shadow-lg shadow-orange-500/20">
                    <ImagePlus className="w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Teks
                    <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                        ToImages
                    </span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Ketik deskripsi teks, generate gambar realistis otomatis dengan AI
                </p>
            </div>

            {/* Input Area */}
            <div className="mx-auto max-w-xl mb-8">
                <div className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Contoh: black cat, mountain landscape..."
                        disabled={loading}
                        className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 disabled:opacity-50"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-auto max-w-xl mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="mx-auto max-w-xl">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-600/20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                                </div>
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-400 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">
                                    Generating gambar...
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                    AI sedang memproses teks kamu, tunggu sebentar
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Result */}
            {resultUrl && !loading && (
                <div className="mx-auto max-w-xl space-y-6">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                                Hasil Generate
                            </span>
                        </div>

                        {/* Prompt used */}
                        {resultPrompt && (
                            <div className="mb-3 rounded-lg bg-neutral-950 px-3 py-2">
                                <p className="text-xs text-neutral-500">
                                    <span className="font-bold text-neutral-400">Prompt:</span>{" "}
                                    {resultPrompt}
                                </p>
                            </div>
                        )}

                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-950">
                            <Image
                                src={resultUrl}
                                alt={resultPrompt || "AI generated image"}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition hover:shadow-xl hover:shadow-green-500/30"
                        >
                            <Download className="h-4 w-4" />
                            Download JPG
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-3 text-sm font-bold text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                        >
                            <Sparkles className="h-4 w-4" />
                            Generate Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
