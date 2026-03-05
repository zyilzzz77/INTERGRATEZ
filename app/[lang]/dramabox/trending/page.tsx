"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { showToast } from "@/components/Toast";

interface DramaBoxItem {
    id: string;
    cover: string;
    title: string;
    chapterCount?: number;
    introduction?: string;
    tags?: string[];
    playCount?: string;
    protagonist?: string;
    corner?: {
        cornerType: number;
        name: string;
        color: string;
    };
    rankVo?: {
        rankType: number;
        hotCode: string;
        sort: number;
    };
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
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
                </div>
            )}
            {error ? (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                        <rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                    </svg>
                </div>
            ) : (
                <img
                    src={imgSrc} alt={alt}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} fetchPriority={priority ? "high" : "auto"}
                    crossOrigin="anonymous" onLoad={handleLoad} onError={handleError}
                />
            )}
        </>
    );
}

export default function TrendingPage() {
    const [data, setData] = useState<DramaBoxItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            showToast("Memuat drama...", "info");
            try {
                const res = await fetch("/api/dramabox/trending");
                const json = await res.json();
                if (json.status && Array.isArray(json.data)) {
                    setData(json.data);
                }
                showToast("Drama berhasil dimuat", "success");
            } catch (error) {
                console.error("Failed to fetch Trending data:", error);
                showToast("Gagal memuat drama", "error");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <LazyMotion features={domAnimation}>
            <style jsx global>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>

            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dramabox" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
                        Kembali ke DramaBox
                    </Link>
                    <h1 className="text-3xl font-black text-white sm:text-4xl flex items-center gap-3">
                        📈 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Trending</span>
                    </h1>
                    <p className="mt-2 text-sm text-neutral-400">Drama paling populer saat ini</p>
                </div>

                {loading ? (
                    <LoadingState />
                ) : (
                    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {data.map((item, index) => (
                                <Link
                                    href={`/dramabox/detail?id=${item.id}`}
                                    key={`trending-${item.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 cursor-pointer"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
                                        <DramaImage src={item.cover.trim()} alt={item.title} priority={index < 6} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-20 pointer-events-none" />

                                        {/* Rank Number */}
                                        {item.rankVo && (
                                            <div className="absolute top-2 left-2 z-20 flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white text-xs font-black shadow-lg">
                                                {item.rankVo.sort}
                                            </div>
                                        )}

                                        {item.corner && (
                                            <div className="absolute top-2 right-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm" style={{ backgroundColor: item.corner.color || "#F54E96" }}>
                                                {item.corner.name}
                                            </div>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/90 flex-wrap">
                                                {item.rankVo?.hotCode && (
                                                    <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">🔥 {item.rankVo.hotCode}</span>
                                                )}
                                                {item.chapterCount && item.chapterCount > 0 && (
                                                    <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">📑 {item.chapterCount} Eps</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-3">
                                        <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-red-400 leading-tight">{item.title}</h3>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.tags && item.tags.length > 0 ? (
                                                item.tags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} className="text-[10px] rounded-full bg-white/5 px-2 py-0.5 text-neutral-400 border border-white/5">{tag}</span>
                                                ))
                                            ) : item.protagonist ? (
                                                <span className="text-[10px] text-neutral-400 line-clamp-1">{item.protagonist}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
