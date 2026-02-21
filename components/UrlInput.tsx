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

        console.log("[UrlInput] Starting download for:", inputUrl, "Platform:", platform.name);

        onPlatform(platform.name);
        setLoading(true);
        onLoading(true);

        try {
            const endpoint = `/api/download?url=${encodeURIComponent(inputUrl)}&platform=${encodeURIComponent(platform.name)}`;
            const res = await fetch(endpoint);
            const data = await res.json();

            console.log("[UrlInput] API Response:", data);

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
        console.log("[UrlInput] Form submitted");
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
            } catch {}
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
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-neutral-900/50 p-2 shadow-2xl ring-1 ring-white/10 transition-all focus-within:ring-2 focus-within:ring-primary/40 backdrop-blur-md">
                {/* Icon / Paste Button */}
                <div className="flex-shrink-0 pl-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handlePaste}
                        className="h-10 w-10 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white"
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
                    className="border-none bg-transparent px-4 py-6 text-base font-medium text-white placeholder:text-neutral-500 focus-visible:ring-0 shadow-none"
                    disabled={loading}
                    ref={inputRef}
                />

                {/* Clear / Loading / Submit */}
                <div className="flex-shrink-0 pr-2 flex items-center gap-2">
                    {url && !loading && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="h-8 w-8 rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !url}
                        className="h-10 gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110"
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
