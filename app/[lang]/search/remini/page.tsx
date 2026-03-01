"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, Download, Trash2, Loader2, ArrowRight, Zap } from "lucide-react";

export default function ReminiPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultSize, setResultSize] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResultUrl(null);
        setResultSize(null);
        setError(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            const f = e.dataTransfer.files[0];
            if (f && f.type.startsWith("image/")) handleFile(f);
        },
        [handleFile]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const handleEnhance = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResultUrl(null);
        setResultSize(null);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch("/api/tools/remini", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!data.status) {
                setError(data.error || "Gagal enhance foto");
                return;
            }

            setResultUrl(data.result);
            setResultSize(data.size || null);
        } catch {
            setError("Terjadi kesalahan. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setResultUrl(null);
        setResultSize(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDownload = async () => {
        if (!resultUrl) return;
        try {
            const res = await fetch(resultUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `remini-hd-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            window.open(resultUrl, "_blank");
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-2xl text-white shadow-lg shadow-amber-500/20">
                    <Zap className="w-7 h-7" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Remini{" "}
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                        HD
                    </span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Upload foto buram, enhance jadi HD otomatis dengan AI
                </p>
            </div>

            {/* Upload Area */}
            {!preview && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`mx-auto max-w-lg cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all ${dragActive
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50"
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleInputChange}
                        className="hidden"
                    />

                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500">
                        <Upload className="h-7 w-7" />
                    </div>

                    <p className="text-base font-bold text-white">
                        Drag & Drop atau Klik untuk Upload
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                        JPG, PNG, WebP · Maksimal 10MB
                    </p>
                </div>
            )}

            {/* Preview & Result */}
            {preview && (
                <div className="space-y-8">
                    {/* Before / After */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Original */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-neutral-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                    Original
                                </span>
                            </div>
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-950">
                                <Image
                                    src={preview}
                                    alt="Original"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Result */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                        HD Result
                                    </span>
                                </div>
                                {resultSize && (
                                    <span className="text-xs text-neutral-500">{resultSize}</span>
                                )}
                            </div>
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-950">
                                {loading && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                                        <span className="text-xs font-bold text-neutral-400">
                                            Enhancing foto...
                                        </span>
                                    </div>
                                )}
                                {resultUrl && (
                                    <Image
                                        src={resultUrl}
                                        alt="HD Result"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                )}
                                {!loading && !resultUrl && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                        <ArrowRight className="h-6 w-6 text-neutral-600" />
                                        <span className="text-xs text-neutral-600">
                                            Klik tombol di bawah
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {!resultUrl && (
                            <button
                                onClick={handleEnhance}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="h-4 w-4" />
                                )}
                                {loading ? "Memproses..." : "Enhance HD"}
                            </button>
                        )}

                        {resultUrl && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition hover:shadow-xl hover:shadow-green-500/30"
                            >
                                <Download className="h-4 w-4" />
                                Download HD
                            </button>
                        )}

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-3 text-sm font-bold text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                            Upload Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
