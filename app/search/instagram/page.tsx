"use client";

import { useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";

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
    const [result, setResult] = useState<IGProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResult(null);
        setError("");

        try {
            const res = await fetch(
                `/api/stalker/instagram?username=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch {
            setError("Gagal mengambil data profil");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-2xl text-white shadow-lg ring-1 ring-white/20">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black text-white">
                    Instagram Stalk
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Lihat info profil Instagram — followers, following, posts
                </p>
            </div>

            <SearchBar
                placeholder="Masukkan username Instagram..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Result */}
            <div className="mt-10">
                {/* Loading */}
                {loading && (
                    <div className="mx-auto max-w-md">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="skeleton h-24 w-24 rounded-full" />
                                <div className="skeleton h-5 w-40" />
                                <div className="skeleton h-4 w-28" />
                                <div className="mt-4 grid w-full grid-cols-3 gap-4">
                                    <div className="skeleton h-12 rounded-lg" />
                                    <div className="skeleton h-12 rounded-lg" />
                                    <div className="skeleton h-12 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                {!loading && result && (
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                            {/* Gradient Header */}
                            <div className="relative h-28 bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-orange-400/30">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.2),transparent_70%)]" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
                            </div>

                            {/* Avatar */}
                            <div className="-mt-14 flex justify-center">
                                <div className="relative">
                                    {result.avatar ? (
                                        <Image
                                            src={`/api/proxy-image?url=${encodeURIComponent(result.avatar)}`}
                                            alt={result.username}
                                            width={112}
                                            height={112}
                                            className="h-28 w-28 rounded-full border-4 border-neutral-900 object-cover shadow-xl"
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-neutral-900 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-4xl shadow-xl">
                                            {result.fullName ? result.fullName.charAt(0).toUpperCase() : result.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {result.isVerified && (
                                        <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm text-white shadow ring-2 ring-neutral-900">✓</span>
                                    )}
                                    {result.isPrivate && (
                                        <span className="absolute -left-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow ring-2 ring-neutral-900">🔒</span>
                                    )}
                                </div>
                            </div>

                            {/* Name + Username */}
                            <div className="mt-3 text-center px-6">
                                <h2 className="text-xl font-black text-white">
                                    {result.fullName || result.username}
                                </h2>
                                <p className="text-sm text-neutral-400">@{result.username}</p>

                                {/* Category */}
                                {result.category && (
                                    <span className="mt-2 inline-block rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-neutral-400 ring-1 ring-white/10">
                                        {result.category}
                                    </span>
                                )}

                                {/* Biography */}
                                {result.biography && result.biography !== "-" && (
                                    <p className="mt-3 text-xs leading-relaxed text-neutral-500 whitespace-pre-line">
                                        {result.biography}
                                    </p>
                                )}

                                {/* Bio Links */}
                                {result.bioLinks.length > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                                        {result.bioLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-medium text-purple-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-purple-300"
                                            >
                                                🔗 {link.title || link.url}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Badges */}
                                <div className="mt-3 flex items-center justify-center gap-2 text-[10px]">
                                    {result.isBusiness && (
                                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-400 ring-1 ring-blue-500/20">💼 Business</span>
                                    )}
                                    {result.isPrivate && (
                                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-400 ring-1 ring-red-500/20">🔒 Private</span>
                                    )}
                                    {result.isVerified && (
                                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-400 ring-1 ring-blue-500/20">✅ Verified</span>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-5 grid grid-cols-3 border-t border-white/5 divide-x divide-white/5">
                                {[
                                    { label: "Posts", value: result.stats.posts, icon: "📸" },
                                    { label: "Followers", value: result.stats.followers, icon: "👥" },
                                    { label: "Following", value: result.stats.following, icon: "➡️" },
                                ].map((s) => (
                                    <div key={s.label} className="py-5 text-center">
                                        <p className="text-lg font-black text-white">{formatNumber(s.value)}</p>
                                        <p className="mt-0.5 text-[10px] text-neutral-500">{s.icon} {s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            <div className="p-4">
                                <a
                                    href={`https://www.instagram.com/${result.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:shadow-pink-500/25 hover:brightness-110"
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
                        <p className="text-lg font-bold text-red-400">❌ {error}</p>
                        <p className="mt-1 text-sm text-neutral-600">Pastikan username benar</p>
                    </div>
                )}

                {/* No search yet hint */}
                {!loading && !hasSearched && (
                    <div className="mt-16 text-center">
                        <p className="text-5xl mb-4">🔍</p>
                        <p className="text-sm text-neutral-500">
                            Masukkan username Instagram untuk melihat profil
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
