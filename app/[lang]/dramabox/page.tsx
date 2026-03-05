"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Search, Play } from "lucide-react";
import { showToast } from "@/components/Toast";

interface DramaBoxItem {
    id: string;
    cover: string;
    title: string;
    uri?: string;
    chapterCount?: number;
    introduction?: string;
    tags?: string[];
    playCount?: string;
    corner?: { cornerType: number; name: string; color: string };
    rankVo?: { rankType: number; hotCode: string; recCopy: string; sort: number };
    statistics?: { views: number; chapters: number };
    labels?: string[];
    synopsis?: string;
    protagonist?: string;
}

interface DramaBoxResponse {
    status: boolean;
    title?: string;
    data: DramaBoxItem[];
}

/* ═══════ LOADING STATE ═══════ */
function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full animate-ping" style={{ background: 'var(--drama-glow-red)', animationDuration: '2s' }} />
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 0 40px var(--drama-glow-red)' }}>
                    <Image src="/logo-dramabox.png" alt="DramaBox" width={80} height={80} className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full" style={{ background: 'var(--drama-elevated)' }}>
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" style={{ animation: 'shimmer 1.2s ease-in-out infinite' }} />
            </div>
            <p className="mt-4 text-sm animate-pulse" style={{ color: 'var(--drama-text-muted)' }}>Memuat drama...</p>
        </div>
    );
}

/* ═══════ DRAMA IMAGE ═══════ */
function DramaImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [imgSrc, setImgSrc] = useState(src);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => {
        if (retryCount < 2) {
            setTimeout(() => { setRetryCount(c => c + 1); setImgSrc(`${src}${src.includes("?") ? "&" : "?"}retry=${retryCount + 1}`); }, 2000);
        } else { setError(true); setLoaded(true); }
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                </div>
            ) : (
                <img src={imgSrc} alt={alt}
                    sizes="(max-width:640px) 50vw,(max-width:768px) 33vw,(max-width:1024px) 25vw,20vw"
                    className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} fetchPriority={priority ? "high" : "auto"} crossOrigin="anonymous"
                    onLoad={handleLoad} onError={handleError}
                />
            )}
        </>
    );
}

/* ═══════ PREMIUM CARD ═══════ */
function DramaBoxCard({ item, index }: { item: DramaBoxItem; index: number }) {
    return (
        <Link href={`/dramabox/detail?id=${item.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
            style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>

            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ boxShadow: '0 0 30px var(--drama-glow-red), 0 0 60px var(--drama-glow-red)' }} />

            <div className="relative aspect-[2/3] w-full overflow-hidden">
                <DramaImage src={item.cover.trim()} alt={item.title} priority={index < 6} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500 z-10" />

                {/* Play reveal */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                </div>

                {/* Corner Badge */}
                {item.corner && (
                    <div className="absolute top-2.5 left-2.5 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
                        style={{ backgroundColor: item.corner.color || '#F54E96' }}>
                        {item.corner.name}
                    </div>
                )}
                {!item.corner && item.labels && item.labels[0] && (
                    <div className="absolute top-2.5 left-2.5 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)' }}>
                        {item.labels[0]}
                    </div>
                )}

                {/* Rank Badge */}
                {item.rankVo && (
                    <div className="absolute top-2.5 right-2.5 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-yellow-400 shadow-lg backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        🏆 {item.rankVo.recCopy}
                    </div>
                )}

                {/* Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-wrap gap-1.5">
                    {item.playCount && <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md" style={{ background: 'var(--drama-badge-bg)' }}>🔥 {item.playCount}</span>}
                    {item.chapterCount && item.chapterCount > 0 && <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md" style={{ background: 'var(--drama-badge-bg)' }}>📑 {item.chapterCount} Eps</span>}
                    {!item.playCount && item.statistics && (
                        <>
                            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md" style={{ background: 'var(--drama-badge-bg)' }}>👁️ {item.statistics.views.toLocaleString()}</span>
                            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md" style={{ background: 'var(--drama-badge-bg)' }}>📑 {item.statistics.chapters}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-tight transition-colors duration-300" style={{ color: 'var(--drama-text)' }}>{item.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags && item.tags.length > 0 ? (
                        item.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[10px] rounded-full px-2 py-0.5" style={{ background: 'var(--drama-elevated)', color: 'var(--drama-text-muted)', border: '1px solid var(--drama-border)' }}>{tag}</span>
                        ))
                    ) : item.protagonist ? (
                        <span className="text-[10px] line-clamp-1" style={{ color: 'var(--drama-text-muted)' }}>{item.protagonist}</span>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}

/* ═══════ FEATURE BUTTONS ═══════ */
const featureButtons = [
    { href: "/dramabox/foryou", icon: "✨", title: "Untukmu", desc: "Pilihan spesial", gradient: "from-purple-600 to-pink-600" },
    { href: "/dramabox/trending", icon: "📈", title: "Trending", desc: "Paling populer", gradient: "from-yellow-500 to-orange-600" },
    { href: "/dramabox/dubbed", icon: "🎙️", title: "Sulih Suara", desc: "Drama dubbing Indo", gradient: "from-indigo-600 to-purple-600" },
    { href: "/dramabox/vip", icon: "💎", title: "VIP", desc: "Premium dramas", gradient: "from-pink-600 to-purple-600" },
];

/* ═══════ MAIN PAGE ═══════ */
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
            showToast("Memuat drama...", "info");
            try {
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
                const seen = new Set<string>();
                allItems = allItems.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
                setData(allItems);
                setCurrentPage(INITIAL_PAGES);
                const lastResult = results[results.length - 1];
                if (!lastResult?.status || !lastResult?.data?.length || lastResult.data.length < 5) setHasMore(false);
                showToast("Drama berhasil dimuat", "success");
            } catch (error) {
                console.error("Failed to fetch DramaBox:", error);
                showToast("Gagal memuat drama", "error");
            }
            finally { setLoading(false); }
        }
        fetchInitialData();
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        showToast("Memuat drama lainnya...", "info");
        try {
            const nextPage = currentPage + 1;
            const res = await fetch(`/api/dramabox/home?page=${nextPage}`);
            const json = await res.json();
            if (json.status && Array.isArray(json.data) && json.data.length > 0) {
                const ids = new Set(data.map(d => d.id));
                const newItems = json.data.filter((i: DramaBoxItem) => !ids.has(i.id));
                if (newItems.length > 0) setData(prev => [...prev, ...newItems]);
                setCurrentPage(nextPage);
                if (json.data.length < 5) setHasMore(false);
                showToast(`Memuat ${newItems.length} drama tambahan`, "success");
            } else { setHasMore(false); }
        } catch (err) {
            console.error("Load more failed:", err);
            showToast("Gagal memuat drama tambahan", "error");
        }
        finally { setLoadingMore(false); }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        setIsSearching(true);
        showToast(`Mencari: ${searchQuery}...`, "info");
        try {
            const res = await fetch(`/api/dramabox/search?query=${encodeURIComponent(searchQuery)}`);
            const json: DramaBoxResponse = await res.json();
            const results = json.status && Array.isArray(json.data) ? json.data : [];
            setSearchResults(results);
            showToast(`Ditemukan ${results.length} hasil untuk "${searchQuery}"`, "success");
        } catch {
            setSearchResults([]);
            showToast("Gagal mencari drama", "error");
        }
        finally { setIsSearching(false); }
    };

    const isShowingSearch = searchQuery.trim().length > 0;
    const displayData = isShowingSearch ? searchResults : data;
    const isLoading = isShowingSearch ? isSearching : loading;

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">

                {/* ═══════ HERO ═══════ */}
                <div className="noise-overlay relative mb-16 overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-20" style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                    <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)', opacity: 'var(--drama-orb-opacity)' }} />
                    <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)', opacity: 'var(--drama-orb-opacity)', animation: 'float 8s ease-in-out infinite' }} />
                    <div className="pointer-events-none absolute top-20 right-[15%] h-40 w-40 rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)', opacity: 'var(--drama-orb-opacity)', animation: 'float 6s ease-in-out infinite reverse' }} />

                    {/* Logo with glow ring */}
                    <m.div initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 mb-6 inline-flex">
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-3xl opacity-60" style={{ background: 'conic-gradient(from 0deg, #ef4444, #f97316, #dc2626, #ef4444)', animation: 'mesh-rotate 4s linear infinite', filter: 'blur(12px)' }} />
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/10 sm:h-24 sm:w-24">
                                <Image src="/logo-dramabox.png" alt="DramaBox" fill priority className="object-cover" />
                            </div>
                        </div>
                    </m.div>

                    <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="relative z-10">
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                            Drama Streaming
                        </span>
                    </m.div>
                    <m.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative z-10 mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--drama-text)' }}>
                        DramaBox
                    </m.h1>
                    <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative z-10 mx-auto mt-3 max-w-md text-base sm:text-lg" style={{ color: 'var(--drama-text-muted)' }}>
                        Temukan drama China populer dan terbaru
                    </m.p>

                    {/* Search */}
                    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="relative z-10 mx-auto mt-10 max-w-2xl">
                        <form onSubmit={handleSearch} className="group relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><Search className="h-5 w-5" style={{ color: 'var(--drama-text-muted)' }} /></div>
                            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }}
                                className="block w-full rounded-2xl py-4.5 pl-13 pr-24 text-[15px] font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                style={{ background: 'var(--drama-search-bg)', border: '1px solid var(--drama-border)', color: 'var(--drama-text)', backdropFilter: 'blur(20px)' }}
                                placeholder="Cari drama..."
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}>Cari</button>
                        </form>
                    </m.div>
                </div>

                {/* ═══════ FEATURE BUTTONS ═══════ */}
                {!isShowingSearch && !isLoading && (
                    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mb-12 grid grid-cols-4 gap-2 sm:gap-4">
                        {featureButtons.map((btn) => (
                            <Link key={btn.href} href={btn.href}
                                className="group relative flex flex-col items-center gap-2 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4 transition-all duration-300 hover:-translate-y-1"
                                style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                                <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${btn.gradient} text-lg sm:text-xl shadow-lg`}>
                                    {btn.icon}
                                </div>
                                <div className="min-w-0 text-center sm:text-left">
                                    <h3 className="text-[11px] sm:text-sm font-bold truncate" style={{ color: 'var(--drama-text)' }}>{btn.title}</h3>
                                    <p className="hidden sm:block text-[11px] truncate" style={{ color: 'var(--drama-text-muted)' }}>{btn.desc}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block ml-auto h-4 w-4 shrink-0 transition-colors" style={{ color: 'var(--drama-text-badge)' }}>
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </Link>
                        ))}
                    </m.div>
                )}

                {/* ═══════ CONTENT ═══════ */}
                {isLoading ? <LoadingState /> : (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col gap-16">
                        {displayData.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
                                <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--drama-text)' }}>
                                    {isShowingSearch ? <>Hasil: <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">"{searchQuery}"</span></> : `🔥 ${sectionTitle}`}
                                </h2>
                            </div>
                        )}

                        {displayData.length === 0 && isShowingSearch && (
                            <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)' }}>
                                <Search className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--drama-text-badge)' }} />
                                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--drama-text)' }}>Tidak ditemukan</h3>
                                <p style={{ color: 'var(--drama-text-muted)' }}>Coba kata kunci lain</p>
                            </div>
                        )}

                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {displayData.map((item, i) => <DramaBoxCard key={`${item.id}-${i}`} item={item} index={i} />)}
                        </div>

                        {!isShowingSearch && hasMore && (
                            <div className="flex justify-center">
                                <button onClick={loadMore} disabled={loadingMore}
                                    className="group relative flex items-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-semibold transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: 'var(--drama-card)', border: '1px solid var(--drama-border)', color: 'var(--drama-text)' }}>
                                    <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'conic-gradient(from 0deg, var(--drama-glow-red), transparent, var(--drama-glow-red))', filter: 'blur(4px)' }} />
                                    <span className="relative z-10 flex items-center gap-2.5">
                                        {loadingMore ? (
                                            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-red-500" /> Memuat...</>
                                        ) : (
                                            <>Muat Lebih Banyak <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-y-0.5"><path d="m6 9 6 6 6-6" /></svg></>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
