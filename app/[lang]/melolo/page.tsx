"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface MeloloItem {
    id: string;
    title: string;
    cover: string;
    abstract: string;
    episodeCount: number;
    viewCount: string;
    tags: string[];
    status: string;
    author: string;
    isHot: boolean;
    isDubbed: boolean;
    category: string;
}

function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <m.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-28 w-28 rounded-full bg-rose-500/20"
                />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 shadow-xl shadow-rose-500/20 text-4xl">
                    🎬
                </div>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                />
            </div>
        </div>
    );
}

function DramaImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [imgSrc, setImgSrc] = useState(src);
    const MAX_RETRIES = 2;

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => {
        if (retryCount < MAX_RETRIES) {
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

export default function MeloloPage() {
    const [data, setData] = useState<MeloloItem[]>([]);
    const [searchResults, setSearchResults] = useState<MeloloItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextOffset, setNextOffset] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const res = await fetch("/api/melolo/home?offset=0");
                const json = await res.json();

                if (json.status && Array.isArray(json.data)) {
                    setData(json.data);
                    setHasMore(json.hasMore ?? false);
                    setNextOffset(json.nextOffset ?? 0);
                }
            } catch (error) {
                console.error("Failed to fetch Melolo data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInitialData();
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        try {
            const res = await fetch(`/api/melolo/home?offset=${nextOffset}`);
            const json = await res.json();

            if (json.status && Array.isArray(json.data) && json.data.length > 0) {
                const existingIds = new Set(data.map(d => d.id));
                const newItems = json.data.filter((item: MeloloItem) => !existingIds.has(item.id));

                if (newItems.length > 0) {
                    setData(prev => [...prev, ...newItems]);
                }

                setHasMore(json.hasMore ?? false);
                setNextOffset(json.nextOffset ?? 0);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/melolo/search?q=${encodeURIComponent(searchQuery)}`);
            const json = await res.json();
            if (json.status && Array.isArray(json.data)) {
                setSearchResults(json.data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const isShowingSearch = searchQuery.trim().length > 0;
    const displayData = isShowingSearch ? searchResults : data;
    const isLoading = isShowingSearch ? isSearching : loading;

    return (
        <LazyMotion features={domAnimation}>
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>

            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg ring-1 ring-white/20 text-4xl">
                        🎬
                    </div>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">
                        Melolo <span className="text-rose-500">Drama</span>
                    </h1>
                    <p className="mt-3 text-sm text-neutral-400 sm:text-base">
                        Nonton drama China populer dan trending terbaru
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (!e.target.value) setSearchResults([]);
                                }}
                                placeholder="Cari drama..."
                                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 pl-12 text-white placeholder-neutral-500 backdrop-blur-sm transition-all focus:border-rose-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-rose-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-rose-500"
                            >
                                Cari
                            </button>
                        </div>
                    </form>
                </div>

                {/* Content */}
                {isLoading ? (
                    <LoadingState />
                ) : (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-4"
                    >
                        {/* Section Title */}
                        {displayData.length > 0 && (
                            <h2 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-2">
                                {isShowingSearch ? (
                                    <>🔍 Hasil Pencarian: <span className="text-rose-400">"{searchQuery}"</span></>
                                ) : (
                                    <>🔥 Trending Drama</>
                                )}
                            </h2>
                        )}

                        {displayData.length === 0 && isShowingSearch && !isSearching && (
                            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 h-16 w-16">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                                <p className="text-lg font-medium">Tidak ditemukan</p>
                                <p className="text-sm">Coba kata kunci lain</p>
                            </div>
                        )}

                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {displayData.map((item, index) => (
                                <Link
                                    href={`/melolo/detail?id=${item.id}`}
                                    key={`${item.id}-${index}`}
                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/10"
                                >
                                    {/* Cover Image */}
                                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                        <DramaImage
                                            src={item.cover.trim()}
                                            alt={item.title}
                                            priority={index < 6}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-20 pointer-events-none" />

                                        {/* Hot Badge */}
                                        {item.isHot && (
                                            <div className="absolute top-2 left-2 z-20 rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                                                🔥 HOT
                                            </div>
                                        )}

                                        {/* Dubbed Badge */}
                                        {item.isDubbed && (
                                            <div className="absolute top-2 right-2 z-20 rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                                                🎙️ Sulih Suara
                                            </div>
                                        )}

                                        {/* Stats Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/90 flex-wrap">
                                                {item.viewCount && (
                                                    <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                        👁️ {item.viewCount}
                                                    </span>
                                                )}
                                                {item.episodeCount > 0 && (
                                                    <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                        📑 {item.episodeCount} Eps
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-1 flex-col p-3">
                                        <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-rose-400 leading-tight">
                                            {item.title}
                                        </h3>

                                        {/* Tags */}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.tags?.slice(0, 2).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[10px] rounded-full bg-white/5 px-2 py-0.5 text-neutral-400 border border-white/5"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {item.status && (
                                                <span className="text-[10px] rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {!isShowingSearch && hasMore && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                            Memuat...
                                        </>
                                    ) : (
                                        <>
                                            Muat Lebih Banyak
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
