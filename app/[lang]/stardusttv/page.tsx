"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Search, X, Play } from "lucide-react";
import { showToast } from "@/components/Toast";

interface StardustTVItem {
    id: string;
    slug: string;
    title: string;
    poster: string;
}

interface StardustTVResponse {
    data: StardustTVItem[];
    success: boolean;
}

/* ═══════ LOADING STATE ═══════ */
function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full animate-ping" style={{ background: 'var(--drama-glow-purple)', animationDuration: '2s' }} />
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 0 40px rgba(6,182,212,0.4)' }}>
                    <Image src="/logo-stardusttv.png" alt="StardustTV" width={80} height={80} className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full" style={{ background: 'var(--drama-elevated)' }}>
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ animation: 'shimmer 1.2s ease-in-out infinite' }} />
            </div>
            <p className="mt-4 text-sm text-neutral-500 animate-pulse">Memuat drama...</p>
        </div>
    );
}

/* ═══════ DRAMA IMAGE WITH SHIMMER ═══════ */
function DramaImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [imgSrc, setImgSrc] = useState(src);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => {
        if (retryCount < 2) {
            setTimeout(() => {
                setRetryCount(c => c + 1);
                setImgSrc(`${src}${src.includes("?") ? "&" : "?"}retry=${retryCount + 1}`);
            }, 2000);
        } else {
            setError(true);
            setLoaded(true);
        }
    }, [retryCount, src]);

    return (
        <>
            {!loaded && (
                <div className="absolute inset-0 z-10" style={{ background: 'var(--drama-card)' }}>
                    <div className="h-full w-full animate-pulse" style={{ background: 'var(--drama-elevated)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)', animation: 'shimmer 1.5s infinite' }} />
                </div>
            )}
            {error ? (
                <div className="flex h-full w-full items-center justify-center text-neutral-700" style={{ background: 'var(--drama-card)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                        <rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                    </svg>
                </div>
            ) : (
                <img
                    src={imgSrc} alt={alt}
                    sizes="(max-width:640px) 50vw,(max-width:768px) 33vw,(max-width:1024px) 25vw,20vw"
                    className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"}
                    fetchPriority={priority ? "high" : "auto"} crossOrigin="anonymous"
                    onLoad={handleLoad} onError={handleError}
                />
            )}
        </>
    );
}

/* ═══════ PREMIUM DRAMA CARD ═══════ */
function DramaCard({ item, index, accentColor }: {
    item: StardustTVItem;
    index: number;
    accentColor: string;
}) {
    const href = `/stardusttv/watch?slug=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}&poster=${encodeURIComponent(item.poster)}`;

    return (
        <Link href={href} className="group relative flex flex-col overflow-hidden cursor-pointer border-2 border-black/80 dark:border-white/80 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-yellow-300 dark:bg-zinc-800 "
            style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}
        >
            {/* Glow on hover */}
            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ boxShadow: `0 0 30px ${accentColor}, 0 0 60px ${accentColor}` }} />

            {/* Cover */}
            <div className="relative aspect-[2/3] w-full overflow-hidden">
                <DramaImage src={item.poster.trim()} alt={item.title} priority={index < 6} />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500 z-10" />

                {/* Play button reveal */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-tight transition-colors duration-300" style={{ color: 'var(--drama-text)' }}>
                    {item.title}
                </h3>
            </div>
        </Link>
    );
}

/* ═══════ MAIN PAGE ═══════ */
export default function StardustTVPage() {
    const [dramas, setDramas] = useState<StardustTVItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<StardustTVItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            showToast("Memuat drama...", "info");
            try {
                const res = await fetch("/api/stardusttv/home");
                const json: StardustTVResponse = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setDramas(json.data);
                }
                showToast("Drama berhasil dimuat", "success");
            } catch (err) {
                console.error("Failed to fetch StardustTV:", err);
                showToast("Gagal memuat drama", "error");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleSearch = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        const q = searchQuery.trim();
        if (!q) { setHasSearched(false); setSearchResults([]); return; }
        setIsSearching(true); setHasSearched(true);
        showToast(`Mencari: ${q}...`, "info");
        try {
            const res = await fetch(`/api/stardusttv/search?q=${encodeURIComponent(q)}`);
            const json = await res.json();
            const results = json.data && Array.isArray(json.data) ? json.data : [];
            setSearchResults(results);
            showToast(`Ditemukan ${results.length} hasil untuk "${q}"`, "success");
        } catch {
            setSearchResults([]);
            showToast("Gagal mencari drama", "error");
        }
        finally { setIsSearching(false); }
    };

    const clearSearch = () => { setSearchQuery(""); setHasSearched(false); setSearchResults([]); };

    const ACCENT = "rgba(6,182,212,0.5)";

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">

                {/* ═══════ HERO SECTION ═══════ */}
                <div className="noise-overlay relative mb-16 overflow-hidden border-2 border-black/80 dark:border-white/80 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-pink-300 dark:bg-zinc-800 px-6 py-14 text-center sm:px-12 sm:py-20" style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                    {/* Mesh gradient orbs */}
                    <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full blur-[120px] opacity-60" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' }} />
                    <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full blur-[100px] opacity-40" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
                    <div className="pointer-events-none absolute top-20 right-[15%] h-40 w-40 rounded-full blur-[80px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite reverse' }} />

                    {/* Logo with glow ring */}
                    <m.div initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 mb-6 inline-flex">
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-3xl opacity-60" style={{ background: 'conic-gradient(from 0deg, #06b6d4, #14b8a6, #38bdf8, #06b6d4)', animation: 'mesh-rotate 4s linear infinite', filter: 'blur(12px)' }} />
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/10 sm:h-24 sm:w-24">
                                <Image src="/logo-stardusttv.png" alt="StardustTV" fill priority className="object-cover" />
                            </div>
                        </div>
                    </m.div>

                    {/* Typography */}
                    <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="relative z-10">
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Streaming Platform
                        </span>
                    </m.div>
                    <m.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative z-10 mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--drama-text)' }}>
                        StardustTV
                    </m.h1>
                    <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative z-10 mx-auto mt-3 max-w-md text-base sm:text-lg" style={{ color: 'var(--drama-text-muted)' }}>
                        Temukan drama pendek populer dan terbaru
                    </m.p>

                    {/* Glassmorphism Search */}
                    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="relative z-10 mx-auto mt-10 max-w-2xl">
                        <form onSubmit={handleSearch} className="group relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 transition-colors duration-300" style={{ color: 'var(--drama-text-muted)' }} />
                            </div>
                            <input
                                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-2xl py-4.5 pl-13 pr-28 text-[15px] font-medium placeholder-[var(--drama-text-badge)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                style={{ background: 'var(--drama-search-bg)', border: '1px solid var(--drama-border)', color: 'var(--drama-text)', backdropFilter: 'blur(20px)' }}
                                placeholder="Cari drama..."
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                {searchQuery && (
                                    <button type="button" onClick={clearSearch} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ color: 'var(--drama-text-muted)' }}>
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <button type="submit" disabled={isSearching}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 shadow-lg disabled:opacity-50 hidden sm:block"
                                    style={{ background: 'linear-gradient(135deg, #06b6d4, #14b8a6)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}>
                                    Cari
                                </button>
                            </div>
                        </form>
                    </m.div>
                </div>

                {/* ═══════ CONTENT ═══════ */}
                {loading ? <LoadingState /> : (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col gap-16">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mb-4" />
                                <p style={{ color: 'var(--drama-text-muted)' }}>Mencari drama...</p>
                            </div>
                        ) : hasSearched ? (
                            <div>
                                <div className="mb-8 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--drama-text)' }}>
                                        Hasil: <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">&quot;{searchQuery}&quot;</span>
                                    </h2>
                                    <span className="text-sm font-medium rounded-full px-4 py-1.5" style={{ background: 'var(--drama-elevated)', color: 'var(--drama-text-muted)' }}>
                                        {searchResults.length} ditemukan
                                    </span>
                                </div>
                                {searchResults.length === 0 ? (
                                    <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                                        <Search className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--drama-text-badge)' }} />
                                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--drama-text)' }}>Tidak ditemukan</h3>
                                        <p style={{ color: 'var(--drama-text-muted)' }}>Coba gunakan kata kunci lain.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {searchResults.map((item, i) => (
                                            <DramaCard key={`s-${item.id}`} item={item} index={i} accentColor={ACCENT} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* All Dramas */
                            <section>
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(20,184,166,0.2))' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-cyan-400">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--drama-text)' }}>Drama Populer</h2>
                                        <p className="text-xs" style={{ color: 'var(--drama-text-muted)' }}>Koleksi drama terbaik di StardustTV</p>
                                    </div>
                                </div>
                                {dramas.length === 0 ? (
                                    <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--drama-text)' }}>Tidak ada drama</h3>
                                        <p style={{ color: 'var(--drama-text-muted)' }}>Coba muat ulang halaman.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {dramas.map((item, i) => (
                                            <DramaCard key={`${item.id}-${i}`} item={item} index={i} accentColor={ACCENT} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
