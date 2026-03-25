"use client";

import { useState, FormEvent, useRef } from "react";
import { Clipboard } from "lucide-react";
import { showToast } from "./Toast";

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    loading?: boolean;
}

export default function SearchBar({
    placeholder = "Cari sesuatu...",
    onSearch,
    loading = false,
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (q) onSearch(q);
    }

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
                setQuery(text);
                // Optional: Auto search on paste? 
                // Usually for search bars, users might want to edit after paste, so maybe not auto-submit.
                // But in UrlInput it does auto-download. 
                // For search, let's just paste.
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
            setQuery(text);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
            <div className="flex overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                <button
                    type="button"
                    onClick={handlePaste}
                    className="flex items-center justify-center px-4 md:px-5 pl-5 md:pl-6 text-black/50 hover:text-black transition-colors"
                    title="Paste from clipboard"
                >
                    <Clipboard className="h-5 w-5" strokeWidth={3} />
                </button>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPaste={handleInputPaste}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                    ref={inputRef}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="m-2 md:m-2.5 mr-2 md:mr-3 flex items-center gap-2 rounded-xl bg-[#ffeb3b] px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <circle cx="11" cy="11" r="7" />
                            <path strokeLinecap="round" d="m16 16 4 4" />
                        </svg>
                    )}
                    Search
                </button>
            </div>
        </form>
    );
}
