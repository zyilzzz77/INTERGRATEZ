"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Search, X } from "lucide-react";

interface DramaWaveItem {
    chapterCount: number;
    cover: string;
    playlet_id: string;
    title: string;
    upload_num: number;
    description?: string; // Often available in recommend API
}

interface DramaWaveCategory {
    title: string;
    list: DramaWaveItem[];
}

interface DramaWaveResponse {
    code: number;
    data: DramaWaveCategory[];
    message: string;
}

function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            {/* Main Circle */}
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden mb-8">
                <Image
                    src="/logo-dramabox.png" // We'll keep this as a placeholder, maybe change later
                    alt="DramaWave Logo"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                />
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="h-full w-full rounded-full bg-white"
                />
            </div>
        </div>
    );
}

/** Optimized image component with shimmer skeleton, eager loading, and error fallback */
function DramaImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [imgSrc, setImgSrc] = useState(src);
    const MAX_RETRIES = 2;

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => {
        if (retryCount < MAX_RETRIES) {
            // Retry after 2 seconds with cache-busting param
            setTimeout(() => {
                setRetryCount((c) => c + 1);
                setImgSrc(`${src}${src.includes("?") ? "&" : "?"}retry=${retryCount + 1}`);
            }, 2000);
        } else {
            setError(true);
            setLoaded(true);
        }
    }, [retryCount, src]);

    return (
        <>
            {/* Shimmer skeleton — visible until image loads */}
            {!loaded && (
                <div className="absolute inset-0 z-10">
                    <div className="h-full w-full animate-pulse bg-neutral-700" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
                            animation: "shimmer 1.5s infinite",
                        }}
                    />
                </div>
            )}

            {error ? (
                /* Fallback icon when all retries exhausted */
                <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                    </svg>
                </div>
            ) : (
                <img
                    src={imgSrc}
                    alt={alt}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"}
                    decoding={priority ? "sync" : "async"}
                    fetchPriority={priority ? "high" : "auto"}
                    crossOrigin="anonymous"
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </>
    );
}

export default function DramaWavePage() {
    const [categories, setCategories] = useState<DramaWaveCategory[]>([]);
    const [recommended, setRecommended] = useState<DramaWaveItem[]>([]);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DramaWaveItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch both Home and Recommend endpoints in parallel
                const [homeRes, recRes] = await Promise.all([
                    fetch("/api/dramawave/home"),
                    fetch("/api/dramawave/recommend")
                ]);

                const [homeJson, recJson]: [DramaWaveResponse, any] = await Promise.all([
                    homeRes.json(),
                    recRes.json()
                ]);

                if (homeJson.code === 200 && Array.isArray(homeJson.data)) {
                    setCategories(homeJson.data);
                }

                if (recJson.code === 200 && Array.isArray(recJson.items)) {
                    // Filter out any placeholders (e.g. "Ranking" title with no cover)
                    const validRecs = recJson.items.filter((item: any) => item.playlet_id && item.cover);
                    setRecommended(validRecs);
                }
            } catch (error) {
                console.error("Failed to fetch DramaWave data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleSearch = async (e?: FormEvent) => {
        if (e) e.preventDefault();

        const q = searchQuery.trim();
        if (!q) {
            setHasSearched(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const res = await fetch(`/api/dramawave/search?q=${encodeURIComponent(q)}&page=1`);
            const json = await res.json();

            if (json.list && Array.isArray(json.list)) {
                setSearchResults(json.list);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Failed to search DramaWave:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setHasSearched(false);
        setSearchResults([]);
    };

    return (
        <LazyMotion features={domAnimation}>
            {/* Shimmer keyframes */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>

            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg ring-1 ring-white/20 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">
                        DramaWave <span className="text-purple-500">Streaming</span>
                    </h1>
                    <p className="mt-3 text-sm text-neutral-400 sm:text-base">
                        Temukan drama pendek populer dan terbaru
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-10 mx-auto max-w-2xl">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-purple-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-11 pr-24 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium backdrop-blur-sm"
                            placeholder="Cari drama, genre, atau artis..."
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                            >
                                Cari
                            </button>
                        </div>
                    </form>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingState />
                ) : (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-10"
                    >
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4" />
                                <p className="text-neutral-400">Mencari drama...</p>
                            </div>
                        ) : hasSearched ? (
                            /* Search Results View */
                            <div>
                                <h2 className="text-xl font-bold text-white sm:text-2xl mb-6 flex items-center justify-between">
                                    <span>Hasil Pencarian: <span className="text-purple-400">"{searchQuery}"</span></span>
                                    <span className="text-sm font-normal text-neutral-400 bg-white/5 px-3 py-1 rounded-full">{searchResults.length} ditemukan</span>
                                </h2>

                                {searchResults.length === 0 ? (
                                    <div className="bg-white/5 rounded-2xl p-10 text-center border border-white/5">
                                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                                            <Search className="h-8 w-8 text-neutral-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Tidak ditemukan</h3>
                                        <p className="text-neutral-400">Coba gunakan kata kunci lain untuk mencari.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {searchResults.map((item, index) => (
                                            <Link
                                                href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`}
                                                key={`search-${item.playlet_id}`}
                                                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                                            >
                                                {/* Cover Image */}
                                                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                                    <DramaImage
                                                        src={item.cover.trim()}
                                                        alt={item.title}
                                                        priority={index < 8}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-20 pointer-events-none" />

                                                    {/* Stats Overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/90">
                                                            <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                                📑 {item.chapterCount} Eps
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex flex-1 flex-col p-3">
                                                    <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-purple-400 leading-tight">
                                                        {item.title}
                                                    </h3>
                                                    {item.description && (
                                                        <p className="line-clamp-2 text-[10px] text-neutral-500 mt-1.5 leading-snug">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Default View (Recommended + Categories) */
                            <>
                                {/* 1. Recommended Section */}
                                {recommended.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 sm:text-2xl mb-4 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-500">
                                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                            </svg>
                                            Rekomendasi
                                        </h2>

                                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {recommended.slice(0, 10).map((item, index) => (
                                                <Link
                                                    href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`}
                                                    key={`rec-${item.playlet_id}`}
                                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                                                >
                                                    {/* Cover Image */}
                                                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                                        <DramaImage
                                                            src={item.cover.trim()}
                                                            alt={item.title}
                                                            priority={index < 3}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 z-20 pointer-events-none" />

                                                        {/* Details Overlay for Recommend */}
                                                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col justify-end h-full">
                                                            <div className="mb-1 text-[10px] font-bold text-white/90">
                                                                <span className="bg-purple-600/80 px-2 py-1 rounded-sm w-fit inline-block mb-1">PILIHAN HARI INI</span>
                                                            </div>
                                                            <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-purple-300 leading-tight mb-1">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/70">
                                                                <span>📑 {item.chapterCount} Eps</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Standard Categories */}
                                {categories.map((category, catIndex) => (
                                    <div key={catIndex}>
                                        <h2 className="text-xl font-bold text-white sm:text-2xl mb-4 flex items-center gap-2">
                                            {category.title}
                                        </h2>

                                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {category.list.map((item, index) => {
                                                // Skip empty top items if any
                                                if (!item.playlet_id) return null;

                                                return (
                                                    <Link
                                                        href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`}
                                                        key={item.playlet_id}
                                                        className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                                                    >
                                                        {/* Cover Image */}
                                                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                                            <DramaImage
                                                                src={item.cover.trim()}
                                                                alt={item.title}
                                                                priority={catIndex === 0 && index < 6}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-20 pointer-events-none" />

                                                            {/* Stats Overlay */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-white/90">
                                                                    <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                                        📑 {item.chapterCount} Eps
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex flex-1 flex-col p-3">
                                                            <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-purple-400 leading-tight">
                                                                {item.title}
                                                            </h3>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
