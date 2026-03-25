"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Search, Play } from "lucide-react";
import { showToast } from "@/components/Toast";

interface NetshortItem {
    id: string;
    libraryId: string;
    title: string;
    cover: string;
    tags: string[];
    heatScore: string;
    isNew: boolean;
    scriptName: string;
    starMessage?: string;
}

/* ═══════ LOADING STATE ═══════ */
function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full bg-[#a0d1d6]/60 animate-ping" />
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo-sm">
                    <Image src="/logo-netshort.png" alt="Netshort" width={80} height={80} className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-1/3 rounded-full bg-black/30 animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-black/70 animate-pulse">Memuat drama...</p>
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
                <div className="absolute inset-0 z-10 bg-gray-100">
                    <div className="h-full w-full animate-pulse bg-white/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-pulse" />
                </div>
            )}
            {error ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-neutral-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                </div>
            ) : (
                <img src={imgSrc || undefined} alt={alt}
                    sizes="(max-width:640px) 50vw,(max-width:768px) 33vw,(max-width:1024px) 25vw,20vw"
                    className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} fetchPriority={priority ? "high" : "auto"}
                    referrerPolicy="no-referrer" onLoad={handleLoad} onError={handleError}
                />
            )}
        </>
    );
}

/* ═══════ PREMIUM CARD ═══════ */
function NetshortCard({ item, index }: { item: NetshortItem; index: number }) {
    return (
        <Link href={`/netshort/detail?id=${item.id}`}
            className="group relative flex flex-col overflow-hidden border-[3px] border-black rounded-2xl bg-white shadow-neo-sm transition-transform duration-200 hover:-translate-y-1">

            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 shadow-[0_0_0_6px_rgba(0,0,0,0.05)]" />

            <div className="relative aspect-[3/4] w-full overflow-hidden">
                <DramaImage src={item.cover.trim()} alt={item.title} priority={index < 6} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {/* Play reveal */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-neo-sm transition-transform duration-200 group-hover:scale-110">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                </div>

                {/* Badges */}
                {item.isNew && (
                    <div className="absolute top-2.5 left-2.5 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-neo-sm backdrop-blur-sm bg-black/70">
                        ✨ Baru
                    </div>
                )}
                {item.heatScore && (
                    <div className="absolute top-2.5 right-2.5 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-neo-sm backdrop-blur-sm bg-black/70">
                        🔥 {item.heatScore}
                    </div>
                )}

                {/* Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    {item.scriptName && <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md bg-black/60">📺 {item.scriptName}</span>}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-black">{item.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-[10px] rounded-full px-2 py-0.5 border border-black/30 bg-white text-black/70">{tag}</span>
                    ))}
                </div>
            </div>
        </Link>
    );
}

/* ═══════ MAIN PAGE ═══════ */
export default function NetshortPage() {
    const [data, setData] = useState<NetshortItem[]>([]);
    const [searchResults, setSearchResults] = useState<NetshortItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextPage, setNextPage] = useState(2);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchInitialData() {
            showToast("Memuat drama...", "info");
            try {
                const res = await fetch("/api/netshort/home?page=1");
                const json = await res.json();
                if (json.status && Array.isArray(json.data)) {
                    setData(json.data); setHasMore(json.hasMore ?? false); setNextPage(json.nextPage ?? 2);
                }
                showToast("Drama berhasil dimuat", "success");
            } catch (err) {
                console.error("Failed to fetch Netshort:", err);
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
            const res = await fetch(`/api/netshort/home?page=${nextPage}`);
            const json = await res.json();
            if (json.status && Array.isArray(json.data) && json.data.length > 0) {
                const ids = new Set(data.map(d => d.id));
                const newItems = json.data.filter((i: NetshortItem) => !ids.has(i.id));
                if (newItems.length > 0) setData(prev => [...prev, ...newItems]);
                setHasMore(json.hasMore ?? false); setNextPage(json.nextPage ?? nextPage + 1);
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
            const res = await fetch(`/api/netshort/search?q=${encodeURIComponent(searchQuery)}&page=1`);
            const json = await res.json();
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
            <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">

                {/* ═══════ HERO ═══════ */}
                <div className="relative mb-12 overflow-hidden rounded-3xl border-[3px] border-black bg-[#a0d1d6] px-6 py-10 text-center shadow-neo sm:px-10 sm:py-14">
                    <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        Netshort
                    </m.div>
                    <m.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="text-4xl font-black tracking-tight sm:text-5xl">
                        Drama pendek gaya beranda
                    </m.h1>
                    <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mx-auto mt-3 max-w-2xl text-base font-semibold text-black/70">
                        Tampilan konsisten dengan halaman utama untuk pengalaman yang rapi.
                    </m.p>

                    {/* Search */}
                    <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mx-auto mt-8 max-w-3xl">
                        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center"><Search className="h-5 w-5 text-black/60" /></div>
                                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }}
                                    className="w-full rounded-2xl border-[3px] border-black bg-white px-12 py-4 text-[15px] font-semibold text-black shadow-neo-sm outline-none"
                                    placeholder="Cari drama..."
                                />
                            </div>
                            <button type="submit" className="rounded-2xl border-[3px] border-black bg-white px-6 py-4 text-sm font-black text-black shadow-neo-sm transition-transform duration-200 hover:-translate-y-1">
                                Cari
                            </button>
                        </form>
                    </m.div>
                </div>

                {/* ═══════ CONTENT ═══════ */}
                {isLoading ? <LoadingState /> : (
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col gap-16">
                        {displayData.length > 0 && (
                            <div className="flex items-center gap-3 mb--10">
                                <div className="h-8 w-1 rounded-full bg-black" />
                                <h2 className="text-xl font-black sm:text-2xl text-black">
                                    {isShowingSearch ? <>Hasil: <span className="text-black/60">"{searchQuery}"</span></> : '🔥 Semua Serial'}
                                </h2>
                            </div>
                        )}

                        {displayData.length === 0 && isShowingSearch && (
                            <div className="rounded-2xl border-[3px] border-black bg-white p-12 text-center shadow-neo-sm">
                                <Search className="mx-auto mb-4 h-12 w-12 text-black/50" />
                                <h3 className="mb-1 text-lg font-black text-black">Tidak ditemukan</h3>
                                <p className="text-black/60">Coba kata kunci lain</p>
                            </div>
                        )}

                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {displayData.map((item: any, i: any) => <NetshortCard key={`${item.id}-${i}`} item={item} index={i} />)}
                        </div>

                        {!isShowingSearch && hasMore && (
                            <div className="flex justify-center">
                                <button onClick={loadMore} disabled={loadingMore}
                                    className="group relative flex items-center gap-2.5 rounded-2xl border-[3px] border-black bg-white px-10 py-4 text-sm font-black text-black shadow-neo-sm transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50">
                                    <span className="flex items-center gap-2.5">
                                        {loadingMore ? (
                                            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" /> Memuat...</>
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
