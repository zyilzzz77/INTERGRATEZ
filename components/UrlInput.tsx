"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { detectPlatform } from "@/lib/platformDetector";
import { showToast } from "./Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Clipboard, Download } from "lucide-react";

interface UrlInputProps {
    onResult: (data: unknown) => void;
    onLoading: (loading: boolean) => void;
    onPlatform: (platform: string | null) => void;
}

export default function UrlInput({ onResult, onLoading, onPlatform }: UrlInputProps) {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
            const endpoint = `/api/download?url=${encodeURIComponent(inputUrl)}&platform=${encodeURIComponent(platform.name)}&free=1`;
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
            console.error("[UrlInput] Fetch error:", e);
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

    const requestClipboardText = async () => {
        if (!navigator.clipboard?.readText) {
            throw new Error("clipboard-not-supported");
        }
        if (navigator.permissions?.query) {
            try {
                const permission = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
                if (permission.state === "denied") {
                    throw new Error("clipboard-denied");
                }
            } catch { }
        }
        return navigator.clipboard.readText();
    };

    const handlePaste = async () => {
        try {
            showToast("Minta izin clipboard...", "info");
            const text = await requestClipboardText();
            if (text) {
                setUrl(text);
                handleDownload(text);
            } else {
                showToast("Clipboard kosong", "error");
            }
        } catch (err) {
            inputRef.current?.focus();
            showToast("Izin clipboard ditolak, silakan paste manual", "error");
        }
    };

    const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData("text");
        if (text) {
            e.preventDefault();
            setUrl(text);
            handleDownload(text);
        }
    };

    const handleClear = () => {
        setUrl("");
        onResult(null);
        onPlatform(null);
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl transform transition-transform">
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-white p-2 border-[3px] border-black shadow-neo">
                {/* Icon / Paste Button */}
                <div className="flex-shrink-0 pl-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handlePaste}
                        className="h-10 w-10 rounded-xl text-black hover:bg-gray-100 transition-colors"
                        title="Paste Link"
                    >
                        <Clipboard className="h-5 w-5" />
                    </Button>
                </div>

                {/* Input */}
                <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handleInputPaste}
                    placeholder="Tempel link video di sini..."
                    className="border-none bg-transparent px-4 py-6 text-base font-medium text-black placeholder:text-gray-400 focus-visible:ring-0 shadow-none outline-none focus:outline-none"
                    disabled={loading}
                    ref={inputRef}
                />

                {/* Clear / Loading / Submit */}
                <div className="flex-shrink-0 pr-2 flex items-center gap-2">
                    {url && !loading && (
                        <div
                            role="button"
                            onClick={handleClear}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-black hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !url}
                        className="h-10 gap-2 rounded-xl bg-[#ffeb3b] border-[2px] border-black px-6 font-black text-black shadow-neo-sm transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:-translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffeb3b]/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Proses...</span>
                            </>
                        ) : (
                            <>
                                <span>Unduh</span>
                                <Download className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
