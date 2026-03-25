"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Search, X, Play } from "lucide-react";
import { showToast } from "@/components/Toast";

interface DramaWaveItem {
    chapterCount: number;
    cover: string;
    playlet_id: string;
    title: string;
    upload_num: number;
    description?: string;
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

/* ═══════ LOADING STATE ═══════ */
function LoadingState() {
    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full bg-[#a0d1d6]/60 animate-ping" />
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo-sm">
                    <Image src="/logo-dramawave.png" alt="DramaWave" width={80} height={80} className="h-full w-full object-cover" />
                </div>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-1/3 rounded-full bg-black/30 animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-black/70 animate-pulse">Memuat drama...</p>
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
                <div className="absolute inset-0 z-10 bg-gray-100">
                    <div className="h-full w-full animate-pulse bg-white/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-pulse" />
                </div>
            )}
            {error || !imgSrc ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-neutral-700">
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
function DramaCard({ item, href, index }: {
    item: DramaWaveItem;
    href: string;
    index: number;
}) {
    return (
        <Link href={href} className="group relative flex flex-col overflow-hidden border-[3px] border-black rounded-2xl bg-white shadow-neo-sm transition-transform duration-200 hover:-translate-y-1"
        >
            {/* Glow on hover */}
            <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 shadow-[0_0_0_6px_rgba(0,0,0,0.05)]" />

            {/* Cover */}
            <div className="relative aspect-[2/3] w-full overflow-hidden">
                <DramaImage src={item.cover.trim()} alt={item.title} priority={index < 6} />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {/* Play button reveal */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-neo-sm transition-transform duration-200 group-hover:scale-110">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                </div>

                {/* Episode badge */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md bg-black/60">
                        📑 {item.chapterCount} Episode
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-black">
                    {item.title}
                </h3>
                {item.description && (
                    <p className="line-clamp-1 text-[11px] mt-1.5 leading-snug text-black/70">
                        {item.description}
                    </p>
                )}
            </div>
        </Link>
    );
}

/* ═══════ MAIN PAGE ═══════ */
export default function DramaWavePage() {
    const [categories, setCategories] = useState<DramaWaveCategory[]>([]);
    const [recommended, setRecommended] = useState<DramaWaveItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DramaWaveItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            showToast("Memuat data drama...", "info");
            try {
                const [homeRes, recRes] = await Promise.all([
                    fetch("/api/dramawave/home"),
                    fetch("/api/dramawave/recommend")
                ]);
                const [homeJson, recJson]: [DramaWaveResponse, any] = await Promise.all([homeRes.json(), recRes.json()]);
                if (homeJson.code === 200 && Array.isArray(homeJson.data)) setCategories(homeJson.data);
                if (recJson.code === 200 && Array.isArray(recJson.items)) {
                    setRecommended(recJson.items.filter((i: any) => i.playlet_id && i.cover));
                }
                showToast("Data drama berhasil dimuat", "success");
            } catch (err) {
                console.error("Failed to fetch DramaWave:", err);
                showToast("Gagal memuat data drama", "error");
            }
            finally { setLoading(false); }
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
            const res = await fetch(`/api/dramawave/search?q=${encodeURIComponent(q)}&page=1`);
            const json = await res.json();
            const results = json.list && Array.isArray(json.list) ? json.list : [];
            setSearchResults(results);
            showToast(`Ditemukan ${results.length} hasil untuk "${q}"`, "success");
        } catch {
            setSearchResults([]);
            showToast("Gagal mencari drama", "error");
        }
        finally { setIsSearching(false); }
    };

    const clearSearch = () => { setSearchQuery(""); setHasSearched(false); setSearchResults([]); };

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">

                {/* ═══════ HERO SECTION ═══════ */}
                <div className="relative mb-12 overflow-hidden rounded-3xl border-[3px] border-black bg-[#a0d1d6] px-6 py-10 text-center shadow-neo sm:px-10 sm:py-14">
                    <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        DramaWave
                    </m.div>
                    <m.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="text-4xl font-black tracking-tight sm:text-5xl">
                        Drama pendek dengan tampilan baru
                    </m.h1>
                    <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mx-auto mt-3 max-w-2xl text-base font-semibold text-black/70">
                        Antarmuka diselaraskan dengan beranda untuk pengalaman yang konsisten.
                    </m.p>

                    {/* Search */}
                    <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mx-auto mt-8 max-w-3xl">
                        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center"><Search className="h-5 w-5 text-black/60" /></div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-2xl border-[3px] border-black bg-white px-12 py-4 text-[15px] font-semibold text-black shadow-neo-sm outline-none"
                                    placeholder="Cari drama, genre, atau artis..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {searchQuery && (
                                    <button type="button" onClick={clearSearch} className="rounded-2xl border-[3px] border-black bg-white px-4 py-3 text-sm font-black text-black shadow-neo-sm transition-transform duration-200 hover:-translate-y-1">
                                        Hapus
                                    </button>
                                )}
                                <button type="submit" disabled={isSearching}
                                    className="rounded-2xl border-[3px] border-black bg-white px-6 py-3 text-sm font-black text-black shadow-neo-sm transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50">
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
                                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
                                <p className="text-black/70">Mencari drama...</p>
                            </div>
                        ) : hasSearched ? (
                            <div>
                                <div className="mb-8 flex items-center justify-between">
                                    <h2 className="text-2xl font-black sm:text-3xl text-black">
                                        Hasil: <span className="text-black/60">"{searchQuery}"</span>
                                    </h2>
                                    <span className="text-sm font-medium rounded-full border-[3px] border-black bg-white px-4 py-1.5">
                                        {searchResults.length} ditemukan
                                    </span>
                                </div>
                                {searchResults.length === 0 ? (
                                    <div className="rounded-2xl border-[3px] border-black bg-white p-12 text-center shadow-neo-sm">
                                        <Search className="mx-auto mb-4 h-12 w-12 text-black/50" />
                                        <h3 className="mb-1 text-lg font-black text-black">Tidak ditemukan</h3>
                                        <p className="text-black/60">Coba gunakan kata kunci lain.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {searchResults.map((item, i) => (
                                            <DramaCard key={`s-${item.playlet_id}`} item={item} index={i}
                                                href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Recommended */}
                                {recommended.length > 0 && (
                                    <section>
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black bg-white shadow-neo-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-black">
                                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black sm:text-2xl text-black">Rekomendasi</h2>
                                                <p className="text-xs font-semibold text-black/60">Pilihan terbaik untuk kamu</p>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {recommended.slice(0, 10).map((item, i) => (
                                                <DramaCard key={`r-${item.playlet_id}`} item={item} index={i}
                                                    href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Categories */}
                                {categories.map((category, catIndex) => (
                                    <section key={catIndex}>
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="h-8 w-1 rounded-full bg-black" />
                                            <h2 className="text-xl font-black sm:text-2xl text-black">{category.title}</h2>
                                        </div>
                                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {category.list.filter(i => i.playlet_id).map((item, i) => (
                                                <DramaCard key={item.playlet_id} item={item} index={catIndex === 0 ? i : i + 10}
                                                    href={`/dramawave/watch?id=${item.playlet_id}&chapters=${item.chapterCount}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`} />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </>
                        )}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
