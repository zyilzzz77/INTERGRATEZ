"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { showToast } from "@/components/Toast";

interface IGProfile {
    id: string;
    username: string;
    fullName: string;
    category: string | null;
    biography: string;
    biographyEmail: string;
    bioLinks: { url: string; title?: string }[];
    avatar: string;
    isPrivate: boolean;
    isVerified: boolean;
    isBusiness: boolean;
    stats: {
        followers: string;
        following: string;
        posts: string;
    };
}

function formatNumber(val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return val;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toLocaleString();
}

export default function InstagramSearchPage() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<IGProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResult(null);
        setError("");

        try {
            showToast("Mencari profil Instagram...", "info");
            const res = await fetch(
                `/api/stalker/instagram?username=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                showToast(data.error, "error");
            } else {
                setResult(data);
                showToast("Pencarian selesai", "success");
            }
        } catch {
            setError("Gagal mengambil data profil");
            showToast("Gagal melakukan pencarian", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffb3c6] text-2xl font-black text-black shadow-neo">
                    ☀️
                </div>
                <h1 className="text-3xl font-black text-black">Instagram Stalk</h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    Lihat info profil Instagram — followers, following, posts
                </p>
            </div>

            {/* Search Bar */}
            <form
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (!query.trim()) return;
                    handleSearch(query.trim());
                }}
                className="mx-auto w-full max-w-xl"
            >
                <div className="flex overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                showToast("Membaca clipboard...", "info");
                                const text = await navigator.clipboard.readText();
                                if (text) setQuery(text);
                                else showToast("Clipboard kosong", "error");
                            } catch {
                                inputRef.current?.focus();
                                showToast("Clipboard tidak diizinkan", "error");
                            }
                        }}
                        className="flex items-center justify-center px-4 md:px-5 pl-5 md:pl-6 text-black/50 hover:text-black transition-colors"
                        title="Paste dari clipboard"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 4h6M9 8h6" />
                            <rect x="5" y="4" width="14" height="16" rx="2" ry="2" />
                        </svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Masukkan username Instagram..."
                        className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                    />
                    <div className="m-2 md:m-2.5 mr-2 md:mr-3 flex gap-1.5">
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="flex items-center gap-2 rounded-xl bg-[#ffeb3b] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
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
                            Cari
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setResult(null);
                                setHasSearched(false);
                                setError("");
                            }}
                            className="flex items-center gap-2 rounded-xl bg-[#b3e5fc] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </form>

            {/* Result */}
            <div className="mt-10">
                {/* Loading */}
                {loading && (
                    <div className="mx-auto max-w-md">
                        <div className="rounded-2xl border-[3px] border-black bg-white p-8 shadow-neo">
                            <div className="flex flex-col items-center gap-4">
                                <div className="skeleton h-24 w-24 rounded-2xl border-[3px] border-black" />
                                <div className="skeleton h-5 w-40 rounded-md" />
                                <div className="skeleton h-4 w-28 rounded-md" />
                                <div className="mt-4 grid w-full grid-cols-3 gap-4">
                                    <div className="skeleton h-12 rounded-xl" />
                                    <div className="skeleton h-12 rounded-xl" />
                                    <div className="skeleton h-12 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                {!loading && result && (
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo">
                            <div className="relative h-28 border-b-[3px] border-black bg-[#ffeb3b]">
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_50%,#ffb3c6_0,transparent_45%),radial-gradient(circle_at_70%_40%,#b3e5fc_0,transparent_45%)]" />
                            </div>

                            <div className="-mt-14 flex justify-center">
                                <div className="relative">
                                    {result.avatar ? (
                                        <Image
                                            src={`/api/proxy-image?url=${encodeURIComponent(result.avatar)}`}
                                            alt={result.username}
                                            width={112}
                                            height={112}
                                            className="h-28 w-28 rounded-2xl border-[3px] border-black object-cover shadow-neo-sm"
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-[3px] border-black bg-[#c4b5fd] text-4xl font-black text-black shadow-neo-sm">
                                            {result.fullName ? result.fullName.charAt(0).toUpperCase() : result.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {result.isVerified && (
                                        <span className="absolute -right-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#c4b5fd] text-sm font-black text-black shadow-neo-sm">✓</span>
                                    )}
                                    {result.isPrivate && (
                                        <span className="absolute -left-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#ffb3c6] text-sm font-black text-black shadow-neo-sm">🔒</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 px-6 text-center">
                                <h2 className="text-xl font-black text-black">
                                    {result.fullName || result.username}
                                </h2>
                                <p className="text-sm font-bold text-black/70">@{result.username}</p>

                                {result.category && (
                                    <span className="mt-2 inline-block rounded-full border-[3px] border-black bg-white px-3 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                        {result.category}
                                    </span>
                                )}

                                {result.biography && result.biography !== "-" && (
                                    <p className="mt-3 text-xs font-bold leading-relaxed text-black/70 whitespace-pre-line">
                                        {result.biography}
                                    </p>
                                )}

                                {result.bioLinks.length > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                                        {result.bioLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-xl border-[3px] border-black bg-[#b3e5fc] px-2.5 py-1 text-[10px] font-black text-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:bg-white"
                                            >
                                                🔗 {link.title || link.url}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black text-black/70">
                                    {result.isBusiness && (
                                        <span className="rounded-full border-[3px] border-black bg-[#b3e5fc] px-2 py-0.5 shadow-neo-sm">💼 Business</span>
                                    )}
                                    {result.isPrivate && (
                                        <span className="rounded-full border-[3px] border-black bg-[#ffb3c6] px-2 py-0.5 shadow-neo-sm">🔒 Private</span>
                                    )}
                                    {result.isVerified && (
                                        <span className="rounded-full border-[3px] border-black bg-white px-2 py-0.5 shadow-neo-sm">✅ Verified</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 divide-x-[3px] divide-black border-t-[3px] border-black">
                                {[
                                    { label: "Posts", value: result.stats.posts, icon: "📸" },
                                    { label: "Followers", value: result.stats.followers, icon: "👥" },
                                    { label: "Following", value: result.stats.following, icon: "➡️" },
                                ].map((s) => (
                                    <div key={s.label} className="py-5 text-center">
                                        <p className="text-lg font-black text-black">{formatNumber(s.value)}</p>
                                        <p className="mt-0.5 text-[10px] font-bold text-black/60">{s.icon} {s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t-[3px] border-black">
                                <a
                                    href={`https://www.instagram.com/${result.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full rounded-xl border-[3px] border-black bg-[#ffeb3b] px-4 py-3 text-center text-sm font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                >
                                    Buka Profil Instagram ↗
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="mt-10 text-center">
                        <p className="text-lg font-black text-black/80">❌ {error}</p>
                        <p className="mt-1 text-sm font-bold text-black/60">Pastikan username benar</p>
                    </div>
                )}

                {!loading && !hasSearched && (
                    <div className="mt-16 text-center">
                        <p className="mb-4 text-5xl">🔍</p>
                        <p className="text-sm font-bold text-black/60">
                            Masukkan username Instagram untuk melihat profil
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
