"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";

export default function Teks2AnimatePage() {
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
            const res = await fetch(
                `/api/tools/teks2animate?q=${encodeURIComponent(prompt.trim())}`
            );
            const data = await res.json();

            if (!data.status) {
                setError(data.error || "Gagal generate gambar");
                return;
            }

            setResultUrl(data.url);
            setResultPrompt(data.prompt);
        } catch {
            setError("Terjadi kesalahan. Coba lagi.");
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
            const res = await fetch(resultUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `anime-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
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
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl text-white shadow-lg shadow-cyan-500/20">
                    <Wand2 className="w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Teks
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        2Animate
                    </span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Ketik deskripsi teks, generate gambar anime otomatis dengan AI
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
                        placeholder="Contoh: cat on the fire, sunset beach girl..."
                        disabled={loading}
                        className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 disabled:opacity-50"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                                </div>
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">
                                    Generating gambar anime...
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
                            <div className="h-2 w-2 rounded-full bg-cyan-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
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
                                alt={resultPrompt || "Anime result"}
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
