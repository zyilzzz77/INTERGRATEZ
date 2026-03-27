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

export default function ForYouPage() {
    const [data, setData] = useState<DramaBoxItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            showToast("Memuat drama...", "info");
            try {
                const res = await fetch("/api/dramabox/foryou", { cache: "no-store" });
                const json = await res.json();
                if (json.status && Array.isArray(json.data)) {
                    setData(json.data);
                }
                showToast("Drama berhasil dimuat", "success");
            } catch (error) {
                console.error("Failed to fetch ForYou data:", error);
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
                    <Link href="/dramabox" className="inline-flex items-center gap-2 text-sm font-black text-black bg-white border-[3px] border-black rounded-full px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
                        Kembali ke DramaBox
                    </Link>
                    <h1 className="mt-4 text-3xl font-black text-black sm:text-4xl flex items-center gap-3">
                        ✨ <span className="px-2 rounded-lg border-[3px] border-black bg-gradient-to-r from-[#ffec99] to-[#ffb3c6]">Untukmu</span>
                    </h1>
                    <p className="mt-2 text-sm font-bold text-black/70">Drama pilihan khusus untukmu</p>
                </div>

                {loading ? (
                    <LoadingState />
                ) : (
                    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {data.map((item, index) => (
                                <Link
                                    href={`/dramabox/detail?id=${item.id}`}
                                    key={`foryou-${item.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f3f3f3]">
                                        <DramaImage src={item.cover.trim()} alt={item.title} priority={index < 6} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90 z-20 pointer-events-none" />

                                        {item.corner && (
                                            <div className="absolute top-2 left-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-black text-black bg-white border-[2px] border-black shadow-neo-sm" style={{ backgroundColor: item.corner.color || "#ffec99" }}>
                                                {item.corner.name}
                                            </div>
                                        )}
                                        {item.rankVo && (
                                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md bg-black text-white px-2 py-0.5 text-[10px] font-black shadow-neo-sm">
                                                🏆 {item.rankVo.recCopy}
                                            </div>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-white flex-wrap">
                                                {item.playCount && (
                                                    <span className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">🔥 {item.playCount}</span>
                                                )}
                                                {item.chapterCount && item.chapterCount > 0 && (
                                                    <span className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">📑 {item.chapterCount} Eps</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-3">
                                        <h3 className="line-clamp-2 text-sm font-black text-black group-hover:text-primary leading-tight">{item.title}</h3>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.tags && item.tags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="text-[10px] rounded-full bg-[#ffec99] px-2 py-0.5 text-black font-bold border-[2px] border-black">{tag}</span>
                                            ))}
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
