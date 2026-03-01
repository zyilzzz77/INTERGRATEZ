"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";

interface FFGuild {
    name: string;
    id: string;
    level: number;
    members: number;
    capacity: number;
    leaderName: string;
    leaderUid: string;
}

interface FFProfile {
    uid: string;
    name: string;
    level: number;
    exp: number;
    region: string;
    likes: number;
    signature: string;
    gender: string | null;
    language: string;
    createdAt: string;
    lastLogin: string;
    releaseVersion: string;
    creditScore: number;
    brRankPoint: number;
    brMaxRank: number;
    csRankPoint: number;
    csMaxRank: number;
    guild: FFGuild | null;
    pet: { id: number; level: number } | null;
    bannerImage: string;
}

function formatNum(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toLocaleString();
}

function timeSince(dateStr: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr + " UTC");
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
    if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
    return Math.floor(diff / 86400) + " hari lalu";
}

export default function FreeFireSearchPage() {
    const [result, setResult] = useState<FFProfile | null>(null);
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
                `/api/stalker/freefire?uid=${encodeURIComponent(query.trim())}`
            );
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch {
            setError("Gagal mengambil data player");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 text-2xl text-white shadow-lg ring-1 ring-white/20">
                    🔥
                </div>
                <h1 className="text-3xl font-black text-white">
                    Free Fire ID Search
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari info player Free Fire berdasarkan UID
                </p>
            </div>

            <SearchBar
                placeholder="Masukkan UID Free Fire..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Result */}
            <div className="mt-10">
                {/* Loading */}
                {loading && (
                    <div className="mx-auto max-w-lg">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="skeleton h-20 w-full rounded-xl" />
                                <div className="skeleton h-5 w-48" />
                                <div className="skeleton h-4 w-28" />
                                <div className="mt-4 grid w-full grid-cols-3 gap-3">
                                    <div className="skeleton h-16 rounded-lg" />
                                    <div className="skeleton h-16 rounded-lg" />
                                    <div className="skeleton h-16 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                {!loading && result && (
                    <div className="mx-auto max-w-lg">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                            {/* Banner / Header */}
                            <div className="relative h-24 bg-gradient-to-br from-orange-600/30 via-yellow-500/20 to-red-500/30">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,146,60,0.3),transparent_70%)]" />
                                {/* Level badge */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm ring-1 ring-white/10">
                                    ⭐ Lv. {result.level}
                                </div>
                                {/* Region */}
                                <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm ring-1 ring-white/10">
                                    🌍 {result.region}
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="px-5 pt-4 pb-2 text-center">
                                <h2 className="text-xl font-black text-white">{result.name}</h2>
                                <p className="text-xs text-neutral-500">UID: {result.uid}</p>
                                {result.signature && result.signature !== "-" && (
                                    <p className="mt-1.5 text-xs italic text-neutral-400">&ldquo;{result.signature}&rdquo;</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500 ring-1 ring-white/5">
                                        ❤️ {formatNum(result.likes)} Likes
                                    </span>
                                    {result.language && (
                                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500 ring-1 ring-white/5">
                                            🗣️ {result.language}
                                        </span>
                                    )}
                                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500 ring-1 ring-white/5">
                                        🎮 {result.releaseVersion}
                                    </span>
                                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500 ring-1 ring-white/5">
                                        ⭐ Credit: {result.creditScore}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
                                {/* BR Rank */}
                                <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-3 text-center ring-1 ring-orange-500/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Battle Royale</p>
                                    <p className="mt-1 text-lg font-black text-white">{formatNum(result.brRankPoint)}</p>
                                    <p className="text-[10px] text-neutral-500">Rank Points</p>
                                </div>
                                {/* CS Rank */}
                                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-3 text-center ring-1 ring-blue-500/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Clash Squad</p>
                                    <p className="mt-1 text-lg font-black text-white">{formatNum(result.csRankPoint)}</p>
                                    <p className="text-[10px] text-neutral-500">Rank Points</p>
                                </div>
                            </div>

                            {/* EXP Bar */}
                            <div className="mx-4 mt-3">
                                <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                                    <span>EXP</span>
                                    <span>{formatNum(result.exp)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/5">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all"
                                        style={{ width: `${Math.min((result.exp % 100000) / 1000, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Guild Info */}
                            {result.guild && (
                                <div className="mx-4 mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">⚔️ Guild</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">{result.guild.name}</p>
                                            <p className="text-[10px] text-neutral-500">
                                                Leader: {result.guild.leaderName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-white">Lv. {result.guild.level}</p>
                                            <p className="text-[10px] text-neutral-500">
                                                {result.guild.members}/{result.guild.capacity} Members
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
                                    <p className="text-[10px] text-neutral-500 mb-0.5">📅 Dibuat</p>
                                    <p className="text-xs font-bold text-white">{result.createdAt?.split(" ")[0] || "-"}</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
                                    <p className="text-[10px] text-neutral-500 mb-0.5">🕐 Login Terakhir</p>
                                    <p className="text-xs font-bold text-white">{timeSince(result.lastLogin)}</p>
                                </div>
                            </div>

                            {/* Pet */}
                            {result.pet && (
                                <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
                                    <span className="text-2xl">🐾</span>
                                    <div>
                                        <p className="text-xs font-bold text-white">Pet Active</p>
                                        <p className="text-[10px] text-neutral-500">Level {result.pet.level}</p>
                                    </div>
                                </div>
                            )}

                            {/* Bottom padding */}
                            <div className="h-4" />
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="mt-10 text-center">
                        <p className="text-lg font-bold text-red-400">❌ {error}</p>
                        <p className="mt-1 text-sm text-neutral-600">Pastikan UID benar</p>
                    </div>
                )}

                {/* Hint */}
                {!loading && !hasSearched && (
                    <div className="mt-16 text-center">
                        <p className="text-5xl mb-4">🎮</p>
                        <p className="text-sm text-neutral-500">
                            Masukkan UID Free Fire untuk melihat info player
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
