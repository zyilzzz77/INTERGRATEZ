"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { detectPlatform } from "@/lib/platformDetector";
import { showToast } from "./Toast";

interface UrlInputProps {
    onResult: (data: unknown) => void;
    onLoading: (loading: boolean) => void;
    onPlatform: (platform: string | null) => void;
}

export default function UrlInput({ onResult, onLoading, onPlatform }: UrlInputProps) {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-fill from URL param
    useEffect(() => {
        const urlParam = searchParams.get("url");
        const autoParam = searchParams.get("auto");
        if (urlParam) {
            setUrl(urlParam);
            if (autoParam === "true") {
                handleDownload(urlParam);
            }
        }
    }, [searchParams]);

    async function handleDownload(inputUrl: string = url) {
        if (!inputUrl.trim()) return;

        const platform = detectPlatform(inputUrl);
        if (!platform) {
            showToast("Link tidak didukung atau tidak valid", "error");
            return;
        }

        onPlatform(platform.name);
        setLoading(true);
        onLoading(true);

        try {
            const endpoint = `/api/download?url=${encodeURIComponent(inputUrl)}&platform=${encodeURIComponent(platform.name)}`;
            const res = await fetch(endpoint);
            const data = await res.json();

            if (data.error) {
                showToast(data.detail || data.error, "error");
                onResult(null);
            } else {
                onResult(data);
                showToast("Berhasil memuat data!", "success");
            }
        } catch (e) {
            console.error(e);
            showToast("Gagal memproses link", "error");
            onResult(null);
        } finally {
            setLoading(false);
            onLoading(false);
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleDownload();
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setUrl(text);
                handleDownload(text);
            }
        } catch (err) {
            showToast("Gagal paste dari clipboard", "error");
        }
    };

    const handleClear = () => {
        setUrl("");
        onResult(null);
        onPlatform(null);
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-neutral-900 p-2 shadow-2xl ring-1 ring-white/10 transition-all focus-within:ring-2 focus-within:ring-blue-500/40">
                {/* Icon / Paste Button */}
                <div className="flex-shrink-0 pl-2">
                    <button
                        type="button"
                        onClick={handlePaste}
                        className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                        title="Paste Link"
                    >
                        <svg
                            className="h-5 w-5 transition-transform group-hover:scale-110"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                    </button>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Tempel link video di sini..."
                    className="flex-1 bg-transparent px-4 py-3 text-sm font-medium text-white placeholder:text-neutral-500 focus:outline-none sm:text-base"
                    disabled={loading}
                />

                {/* Clear / Loading / Submit */}
                <div className="flex-shrink-0 pr-2">
                    {url && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="mr-2 rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Proses...</span>
                            </>
                        ) : (
                            <>
                                <span>Unduh</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
