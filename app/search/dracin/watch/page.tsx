"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

/* ─── Types ─────────────────────────────────────────── */
interface CastMember {
    name: string;
    photo: string;
}

interface Episode {
    order: number;
    title: string;
    vip: boolean;
    url: string;
}

interface DramaDetail {
    thumbnail: string;
    title: string;
    year: string;
    rating: string;
    type: string;
    place: string[];
    director: string[];
    cast: CastMember[];
    episodes: Episode[];
    playUrl: string;
}

/* ─── Watch Content ─────────────────────────────────── */
function WatchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dramaUrl = searchParams.get("url") || "";
    const playerRef = useRef<HTMLDivElement>(null);

    const [drama, setDrama] = useState<DramaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeEp, setActiveEp] = useState<Episode | null>(null);

    useEffect(() => {
        if (!dramaUrl) {
            setError("URL drama tidak valid");
            setLoading(false);
            return;
        }

        async function fetchDrama() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/search/dracin-get?url=${encodeURIComponent(dramaUrl)}`);
                const data = await res.json();
                if (data.status && data.data) {
                    setDrama(data.data);
                    // Auto-set first episode as active
                    const eps = data.data.episodes;
                    if (eps && eps.length > 0) {
                        setActiveEp(eps[0]);
                    }
                } else {
                    setError(data.error || "Gagal memuat drama");
                }
            } catch {
                setError("Terjadi kesalahan. Coba lagi.");
            } finally {
                setLoading(false);
            }
        }

        fetchDrama();
    }, [dramaUrl]);

    function selectEpisode(ep: Episode) {
        setActiveEp(ep);
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ─── Loading ──────────────────────────────────── */
    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6">
                <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Kembali
                </button>
                <div className="skeleton aspect-video w-full rounded-2xl mb-6" />
                <div className="flex gap-4 mb-6">
                    <div className="skeleton h-48 w-32 shrink-0 rounded-xl" />
                    <div className="flex-1">
                        <div className="skeleton mb-3 h-7 w-3/4 rounded" />
                        <div className="skeleton mb-2 h-4 w-1/3 rounded" />
                        <div className="skeleton mb-3 h-4 w-1/2 rounded" />
                        <div className="flex gap-2"><div className="skeleton h-8 w-8 rounded-full" /><div className="skeleton h-8 w-8 rounded-full" /><div className="skeleton h-8 w-8 rounded-full" /></div>
                    </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {Array.from({ length: 16 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
                </div>
            </div>
        );
    }

    /* ─── Error ─────────────────────────────────────── */
    if (error || !drama) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Kembali
                </button>
                <div className="text-center mt-20">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl mb-4">❌</div>
                    <p className="text-lg font-bold text-neutral-400">{error || "Drama tidak ditemukan"}</p>
                    <p className="mt-2 text-sm text-neutral-600">Coba kembali dan cari lagi</p>
                </div>
            </div>
        );
    }

    // Separate regular episodes from extras (BTS, 番外)
    const regularEps = drama.episodes.filter(ep =>
        !ep.title.includes("BTS") && !ep.title.includes("番外")
    );
    const extraEps = drama.episodes.filter(ep =>
        ep.title.includes("BTS") || ep.title.includes("番外")
    );

    // Current playing URL for iframe  
    const currentPlayUrl = activeEp?.url || drama.playUrl || "";

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Back */}
            <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Kembali
            </button>

            {/* ═══════ VIDEO PLAYER ═══════ */}
            <div ref={playerRef} className="mb-6">
                {currentPlayUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
                        <div className="aspect-video w-full">
                            <iframe
                                key={currentPlayUrl}
                                src={currentPlayUrl}
                                className="h-full w-full"
                                allowFullScreen
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                referrerPolicy="no-referrer"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                            />
                        </div>
                        {/* Now Playing Bar */}
                        <div className="flex items-center gap-3 border-t border-white/5 bg-white/[0.03] px-4 py-2.5">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Sedang Diputar</span>
                            </div>
                            <span className="text-xs text-neutral-300 font-medium line-clamp-1 flex-1">
                                {activeEp?.title || drama.title}
                            </span>
                            {activeEp?.vip && (
                                <span className="text-[8px] bg-amber-500 text-black rounded px-1.5 py-0.5 font-black shrink-0">VIP</span>
                            )}
                            {/* Prev / Next */}
                            {activeEp && regularEps.length > 1 && (
                                <div className="flex items-center gap-1 shrink-0">
                                    {activeEp.order > 1 && (
                                        <button
                                            onClick={() => {
                                                const prev = drama.episodes.find(e => e.order === activeEp.order - 1);
                                                if (prev) selectEpisode(prev);
                                            }}
                                            className="rounded-lg bg-white/5 border border-white/10 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
                                            title="Episode Sebelumnya"
                                        >
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                    )}
                                    {activeEp.order < drama.episodes.length && (
                                        <button
                                            onClick={() => {
                                                const next = drama.episodes.find(e => e.order === activeEp.order + 1);
                                                if (next) selectEpisode(next);
                                            }}
                                            className="rounded-lg bg-white/5 border border-white/10 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
                                            title="Episode Selanjutnya"
                                        >
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/5 bg-neutral-900/50">
                        <p className="text-sm text-neutral-600">Tidak ada video tersedia</p>
                    </div>
                )}
            </div>

            {/* ═══════ DRAMA INFO ═══════ */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
                {/* Thumbnail */}
                {drama.thumbnail && (
                    <div className="relative h-52 w-36 shrink-0 self-center sm:self-start overflow-hidden rounded-xl bg-neutral-800 shadow-lg">
                        <img
                            src={drama.thumbnail}
                            alt={drama.title}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}

                {/* Details */}
                <div className="flex flex-1 flex-col min-w-0">
                    <h1 className="text-xl font-black text-white leading-tight sm:text-2xl">
                        {drama.title}
                    </h1>

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            📅 {drama.year}
                        </span>
                        {drama.rating && (
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                ⭐ {drama.rating}
                            </span>
                        )}
                        {drama.type && (
                            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20 capitalize">
                                🎭 {drama.type}
                            </span>
                        )}
                        {drama.place.map((p) => (
                            <span key={p} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-neutral-400 border border-white/10">
                                📍 {p}
                            </span>
                        ))}
                        {drama.episodes.length > 0 && (
                            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
                                🎞 {regularEps.length} Episode
                            </span>
                        )}
                    </div>

                    {/* Director */}
                    {drama.director.length > 0 && (
                        <p className="mt-2 text-xs text-neutral-500">
                            <span className="font-bold text-neutral-400">Sutradara:</span> {drama.director.join(", ")}
                        </p>
                    )}

                    {/* Cast */}
                    {drama.cast.length > 0 && (
                        <div className="mt-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Cast</p>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {drama.cast.map((c, ci) => (
                                    <div key={ci} className="flex flex-col items-center gap-1 shrink-0 w-12">
                                        {c.photo ? (
                                            <img src={c.photo} alt={c.name} className="h-9 w-9 rounded-full object-cover border-2 border-white/10" loading="lazy" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-neutral-700 flex items-center justify-center text-xs">👤</div>
                                        )}
                                        <span className="text-[8px] font-medium text-neutral-500 text-center leading-tight line-clamp-2">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ EPISODE LIST ═══════ */}
            {regularEps.length > 0 && (
                <div className="mb-5">
                    <h2 className="text-base font-bold text-white mb-3">📺 Daftar Episode</h2>
                    <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                        {regularEps.map((ep) => {
                            const isActive = activeEp?.url === ep.url;
                            return (
                                <button
                                    key={ep.order}
                                    onClick={() => selectEpisode(ep)}
                                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${isActive
                                            ? "border-emerald-400/50 bg-emerald-500/15 shadow-md shadow-emerald-500/10"
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                        }`}
                                >
                                    {/* Episode Number */}
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isActive
                                            ? "bg-emerald-500 text-white"
                                            : ep.vip
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                : "bg-white/5 text-neutral-400 border border-white/10"
                                        }`}>
                                        {isActive ? (
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                        ) : (
                                            ep.order
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold line-clamp-1 ${isActive ? "text-emerald-300" : "text-neutral-300"}`}>
                                            {ep.title}
                                        </p>
                                    </div>

                                    {/* VIP badge */}
                                    {ep.vip && (
                                        <span className="text-[8px] bg-amber-500 text-black rounded px-1.5 py-0.5 font-black shrink-0">VIP</span>
                                    )}

                                    {/* Playing indicator */}
                                    {isActive && (
                                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════ EXTRAS (BTS, 番外) ═══════ */}
            {extraEps.length > 0 && (
                <div>
                    <h2 className="text-base font-bold text-white mb-3">🎬 Bonus & BTS</h2>
                    <div className="space-y-1.5">
                        {extraEps.map((ep, i) => {
                            const isActive = activeEp?.url === ep.url;
                            return (
                                <button
                                    key={i}
                                    onClick={() => selectEpisode(ep)}
                                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${isActive
                                            ? "border-emerald-400/50 bg-emerald-500/15"
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-emerald-500 text-white" : "bg-white/5 text-neutral-500 border border-white/10"
                                        }`}>
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                    <span className={`text-sm font-medium line-clamp-1 flex-1 ${isActive ? "text-emerald-300" : "text-neutral-300"}`}>{ep.title}</span>
                                    {ep.vip && <span className="text-[8px] bg-amber-500 text-black rounded px-1.5 py-0.5 font-black shrink-0">VIP</span>}
                                    {isActive && (
                                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* No episodes fallback */}
            {drama.episodes.length === 0 && drama.playUrl && (
                <div className="text-center py-6">
                    <p className="text-sm text-neutral-500 mb-3">Film ini tidak memiliki daftar episode</p>
                    <a
                        href={drama.playUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-green-700 active:scale-[0.98]"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        Tonton di iQIYI
                    </a>
                </div>
            )}
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────── */
export default function DracinWatchPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="skeleton h-7 w-20 rounded mb-4" />
                <div className="skeleton aspect-video w-full rounded-2xl mb-6" />
                <div className="flex gap-4 mb-6">
                    <div className="skeleton h-48 w-32 rounded-xl" />
                    <div className="flex-1"><div className="skeleton mb-3 h-7 w-3/4 rounded" /><div className="skeleton h-4 w-1/3 rounded" /></div>
                </div>
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
