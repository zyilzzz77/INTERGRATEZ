"use client";

import { useState, FormEvent } from "react";

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

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (q) onSearch(q);
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl">
            <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-md backdrop-blur-sm transition-shadow focus-within:border-white/20 focus-within:shadow-lg focus-within:shadow-white/5">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-5 py-3.5 text-sm text-white outline-none placeholder:text-neutral-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="m-1.5 flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
