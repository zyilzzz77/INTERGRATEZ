"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

interface DramaBoxItem {
    id: string;
    cover: string;
    title: string;
    uri?: string;
    chapterCount?: number;
    introduction?: string;
    tags?: string[];
    playCount?: string;
    corner?: {
        cornerType: number;
        name: string;
        color: string;
    };
    rankVo?: {
        rankType: number;
        hotCode: string;
        recCopy: string;
        sort: number;
    };
    // Legacy fields from search API
    statistics?: {
        views: number;
        chapters: number;
    };
    labels?: string[];
    synopsis?: string;
    protagonist?: string;
}

interface DramaBoxResponse {
    status: boolean;
    title?: string;
    data: DramaBoxItem[];
}

function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <m.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-28 w-28 rounded-full bg-white"
                />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden">
                    <Image src="/logo-dramabox.png" alt="DramaBox Logo" width={80} height={80} className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full rounded-full bg-white"
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

/** Feature navigation buttons */
const featureButtons = [
    {
        href: "/dramabox/foryou",
        icon: "✨",
        title: "Untukmu",
        desc: "Pilihan spesial",
        gradient: "from-purple-600 to-pink-600",
        ring: "ring-purple-500/30",
        hoverBorder: "hover:border-purple-500/40",
    },
    {
        href: "/dramabox/trending",
        icon: "📈",
        title: "Trending",
        desc: "Paling populer",
        gradient: "from-yellow-500 to-orange-600",
        ring: "ring-yellow-500/30",
        hoverBorder: "hover:border-yellow-500/40",
    },
    {
        href: "/dramabox/dubbed",
        icon: "🎙️",
        title: "Sulih Suara",
        desc: "Drama dubbing Indo",
        gradient: "from-indigo-600 to-purple-600",
        ring: "ring-indigo-500/30",
        hoverBorder: "hover:border-indigo-500/40",
    },
    {
        href: "/dramabox/vip",
        icon: "💎",
        title: "VIP",
        desc: "Premium dramas",
        gradient: "from-pink-600 to-purple-600",
        ring: "ring-pink-500/30",
        hoverBorder: "hover:border-pink-500/40",
    }
];

export default function DramaBoxPage() {
    const [data, setData] = useState<DramaBoxItem[]>([]);
    const [sectionTitle, setSectionTitle] = useState("Rekomendasi Populer");
    const [searchResults, setSearchResults] = useState<DramaBoxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const INITIAL_PAGES = 3;

    useEffect(() => {
        async function fetchInitialData() {
            try {
                // Fetch pages 1-3 in parallel for more homepage content
                const pagePromises = Array.from({ length: INITIAL_PAGES }, (_, i) =>
                    fetch(`/api/dramabox/home?page=${i + 1}`).then(r => r.json())
                );
                const results = await Promise.all(pagePromises);

                let allItems: DramaBoxItem[] = [];
                for (const json of results) {
                    if (json.status && Array.isArray(json.data)) {
                        allItems = [...allItems, ...json.data];
                        if (json.title && !sectionTitle) setSectionTitle(json.title);
                    }
                }

                // Deduplicate by id
                const seen = new Set<string>();
                allItems = allItems.filter(item => {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                });

                setData(allItems);
                setCurrentPage(INITIAL_PAGES);

                // If last page returned no/few items, no more pages
                const lastResult = results[results.length - 1];
                if (!lastResult?.status || !lastResult?.data?.length || lastResult.data.length < 5) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Failed to fetch DramaBox data:", error);
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
            const nextPage = currentPage + 1;
            const res = await fetch(`/api/dramabox/home?page=${nextPage}`);
            const json = await res.json();

            if (json.status && Array.isArray(json.data) && json.data.length > 0) {
                const existingIds = new Set(data.map(d => d.id));
                const newItems = json.data.filter((item: DramaBoxItem) => !existingIds.has(item.id));

                if (newItems.length > 0) {
                    setData(prev => [...prev, ...newItems]);
                }

                setCurrentPage(nextPage);

                if (json.data.length < 5) {
                    setHasMore(false);
                }
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
            const res = await fetch(`/api/dramabox/search?query=${encodeURIComponent(searchQuery)}`);
            const json: DramaBoxResponse = await res.json();
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
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg ring-1 ring-white/20 overflow-hidden">
                        <Image src="/logo-dramabox.png" alt="DramaBox Logo" width={80} height={80} className="h-full w-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-black text-white sm:text-4xl">
                        DramaBox <span className="text-red-500">Streaming</span>
                    </h1>
                    <p className="mt-3 text-sm text-neutral-400 sm:text-base">
                        Temukan drama china populer dan terbaru
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
                                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 pl-12 text-white placeholder-neutral-500 backdrop-blur-sm transition-all focus:border-red-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white transition-hover hover:bg-red-500"
                            >
                                Cari
                            </button>
                        </div>
                    </form>
                </div>

                {/* Feature Navigation Buttons */}
                {!isShowingSearch && !isLoading && (
                    <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
                        {featureButtons.map((btn) => (
                            <Link
                                key={btn.href}
                                href={btn.href}
                                className={`group relative flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${btn.hoverBorder}`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${btn.gradient} text-2xl shadow-lg ring-1 ${btn.ring}`}>
                                    {btn.icon}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-white/90 truncate">{btn.title}</h3>
                                    <p className="text-[11px] sm:text-xs text-neutral-400 truncate">{btn.desc}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto h-5 w-5 text-neutral-600 group-hover:text-neutral-400 transition-colors shrink-0">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                )}

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
                                    <>🔍 Hasil Pencarian: <span className="text-red-400">"{searchQuery}"</span></>
                                ) : (
                                    <>🔥 {sectionTitle}</>
                                )}
                            </h2>
                        )}

                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {displayData.map((item, index) => {
                                const href = `/dramabox/detail?id=${item.id}`;

                                return (
                                    <Link
                                        href={href}
                                        key={item.id}
                                        className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 cursor-pointer"
                                    >
                                        {/* Cover Image */}
                                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                            <DramaImage
                                                src={item.cover.trim()}
                                                alt={item.title}
                                                priority={index < 6}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-20 pointer-events-none" />

                                            {/* Corner Badge */}
                                            {item.corner && (
                                                <div
                                                    className="absolute top-2 left-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm"
                                                    style={{ backgroundColor: item.corner.color || "#F54E96" }}
                                                >
                                                    {item.corner.name}
                                                </div>
                                            )}

                                            {/* Legacy: Top Right Label */}
                                            {!item.corner && item.labels && item.labels[0] && (
                                                <div className="absolute top-2 right-2 z-20 rounded-md bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                                                    {item.labels[0]}
                                                </div>
                                            )}

                                            {/* Stats Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-white/90 flex-wrap">
                                                    {item.playCount && (
                                                        <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                            🔥 {item.playCount}
                                                        </span>
                                                    )}
                                                    {item.chapterCount && item.chapterCount > 0 && (
                                                        <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                            📑 {item.chapterCount} Eps
                                                        </span>
                                                    )}
                                                    {!item.playCount && item.statistics && (
                                                        <>
                                                            <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                                👁️ {item.statistics.views.toLocaleString()}
                                                            </span>
                                                            <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                                📑 {item.statistics.chapters}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rank Badge */}
                                            {item.rankVo && (
                                                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-yellow-400 shadow-sm backdrop-blur-sm">
                                                    🏆 {item.rankVo.recCopy}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex flex-1 flex-col p-3">
                                            <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-red-400 leading-tight">
                                                {item.title}
                                            </h3>

                                            {/* Tags */}
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {item.tags && item.tags.length > 0 ? (
                                                    item.tags.slice(0, 2).map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] rounded-full bg-white/5 px-2 py-0.5 text-neutral-400 border border-white/5"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : item.protagonist ? (
                                                    <span className="text-[10px] text-neutral-400 line-clamp-1">
                                                        {item.protagonist}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
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
