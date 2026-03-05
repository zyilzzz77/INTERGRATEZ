"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { showToast } from "@/components/Toast";

/* ─── Types ─────────────────────────────────────────── */
interface CastMember {
    name: string;
    photo: string;
}

interface Episode {
    order: number;
    name: string;
    url: string;
    isVip: boolean;
}

interface DracinResult {
    thumbnail: string;
    title: string;
    publishYear: string;
    director: string[];
    cast: CastMember[];
    episodeCount: number;
    episodes: Episode[];
    url: string;
}

/* ─── Component ─────────────────────────────────────── */
export default function DracinSearchPage() {
    const router = useRouter();
    const [results, setResults] = useState<DracinResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        setExpandedIdx(null);

        try {
            showToast("Mencari drama...", "info");
            const res = await fetch(
                `/api/search/dracin?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
                showToast("Pencarian selesai", "success");
            } else {
                showToast("Hasil tidak ditemukan", "info");
            }
        } catch {
            showToast("Gagal melakukan pencarian", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-2xl text-white shadow-lg shadow-emerald-500/20">
                    📺
                </div>
                <h1 className="text-3xl font-black text-white">
                    iQIYI <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Streaming</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari drama &amp; film China, lihat cast, episode &amp; tonton gratis
                </p>
            </div>

            <SearchBar
                placeholder="Cari judul drama atau film..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex gap-4 rounded-2xl border border-white/5 bg-white/5 p-4"
                            >
                                <div className="skeleton h-40 w-28 shrink-0 rounded-xl" />
                                <div className="flex-1">
                                    <div className="skeleton mb-2 h-5 w-3/4 rounded" />
                                    <div className="skeleton mb-2 h-3 w-1/3 rounded" />
                                    <div className="skeleton mb-3 h-3 w-1/2 rounded" />
                                    <div className="flex gap-2">
                                        <div className="skeleton h-8 w-8 rounded-full" />
                                        <div className="skeleton h-8 w-8 rounded-full" />
                                        <div className="skeleton h-8 w-8 rounded-full" />
                                    </div>
                                    <div className="skeleton mt-3 h-9 w-32 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results list */}
                {!loading && results.length > 0 && (
                    <div className="space-y-4">
                        {results.map((r, idx) => (
                            <div
                                key={idx}
                                className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            >
                                <div className="flex gap-4 p-4">
                                    {/* Thumbnail */}
                                    {r.thumbnail && (
                                        <div className="relative h-44 w-30 shrink-0 overflow-hidden rounded-xl bg-neutral-800 sm:w-32">
                                            <img
                                                src={r.thumbnail}
                                                alt={r.title}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                            <span className="absolute top-2 left-2 z-20 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                                📅 {r.publishYear}
                                            </span>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex flex-1 flex-col min-w-0">
                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-emerald-300 transition-colors">
                                            {r.title}
                                        </h3>

                                        {/* Meta badges */}
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            {r.episodeCount > 0 && (
                                                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                                    🎞 {r.episodeCount} Episode
                                                </span>
                                            )}
                                            {r.director.length > 0 && (
                                                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-neutral-400 border border-white/10">
                                                    🎬 {r.director.join(", ")}
                                                </span>
                                            )}
                                        </div>

                                        {/* Cast */}
                                        {r.cast.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Cast</p>
                                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                                    {r.cast.map((c, ci) => (
                                                        <div key={ci} className="flex items-center gap-1.5 shrink-0 rounded-full bg-white/5 border border-white/5 pl-0.5 pr-2.5 py-0.5">
                                                            {c.photo ? (
                                                                <img
                                                                    src={c.photo}
                                                                    alt={c.name}
                                                                    className="h-5 w-5 rounded-full object-cover"
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full bg-neutral-700 flex items-center justify-center text-[8px]">👤</div>
                                                            )}
                                                            <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">{c.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Buttons */}
                                        <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => router.push(`/search/dracin/watch?url=${encodeURIComponent(r.url)}`)}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-green-700 hover:shadow-lg active:scale-[0.98]"
                                            >
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                Tonton
                                            </button>
                                            {r.episodes.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                                                >
                                                    <svg className={`h-3.5 w-3.5 transition-transform ${expandedIdx === idx ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    {r.episodes.length} Eps
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Episodes */}
                                {expandedIdx === idx && r.episodes.length > 0 && (
                                    <div className="border-t border-white/5 px-4 py-3 bg-white/[0.02]">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2">Daftar Episode</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
                                            {r.episodes.map((ep) => (
                                                <a
                                                    key={ep.order}
                                                    href={ep.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`relative flex items-center justify-center rounded-lg border px-2 py-2 text-xs font-bold transition-all hover:scale-105 ${ep.isVip
                                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                        }`}
                                                >
                                                    {ep.isVip && (
                                                        <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black rounded px-1 font-black">VIP</span>
                                                    )}
                                                    Ep {ep.order}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* No results */}
                {!loading && hasSearched && results.length === 0 && (
                    <div className="mt-20 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl mb-4">
                            🔍
                        </div>
                        <p className="text-lg font-bold text-neutral-500">
                            Tidak ada drama ditemukan
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                            Coba kata kunci yang berbeda
                        </p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !hasSearched && (
                    <div className="mt-20 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl mb-4">
                            📺
                        </div>
                        <p className="text-lg font-bold text-neutral-500">
                            Cari Drama &amp; Film China
                        </p>
                        <p className="mt-1 text-sm text-neutral-600 max-w-sm mx-auto">
                            Ketik judul drama atau film di atas untuk mencari dan streaming gratis di iQIYI
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
