"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { showToast } from "@/components/Toast";

interface VipDramaItem {
    bookId: string;
    bookName: string;
    coverWap: string;
    chapterCount: number;
    introduction: string;
    tags: string[];
    playCount: string;
    corner?: {
        cornerType: number;
        name: string;
        color: string;
    };
}

interface VipResponse {
    bannerList: any[];
    watchHistory: any[];
    columnVoList: Array<{
        columnId: number;
        title: string;
        subTitle: string;
        style: string;
        bookList: VipDramaItem[];
        type: number;
    }>;
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
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl overflow-hidden">
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
    const handleLoad = () => setLoaded(true);
    const handleError = () => setError(true);
    return (
        <>
            {!loaded && (
                <div className="absolute inset-0 z-10">
                    <div className="h-full w-full animate-pulse bg-neutral-700" />
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
                    src={src}
                    alt={alt}
                    className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading={priority ? "eager" : "lazy"}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </>
    );
}

export default function DramaBoxVipPage() {
    const [data, setData] = useState<VipDramaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVip() {
            showToast("Memuat drama VIP...", "info");
            try {
                const res = await fetch("https://dramabox.dramabos.my.id/api/v1/vip?lang=in");
                const json: VipResponse = await res.json();
                // The API returns columnVoList, we take the first column's bookList
                const items = json.columnVoList?.[0]?.bookList || [];
                setData(items);
                showToast("Drama VIP berhasil dimuat", "success");
            } catch (e) {
                console.error("Failed to fetch VIP data", e);
                showToast("Gagal memuat drama VIP", "error");
            } finally {
                setLoading(false);
            }
        }
        fetchVip();
    }, []);

    return (
        <LazyMotion features={domAnimation}>
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white border-[3px] border-black shadow-neo overflow-hidden">
                        <Image src="/logo-dramabox.png" alt="DramaBox Logo" width={80} height={80} className="h-full w-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-black text-black sm:text-4xl">
                        DramaBox <span className="px-2 rounded-lg border-[3px] border-black bg-gradient-to-r from-[#ffec99] to-[#ffb3c6]">VIP</span>
                    </h1>
                    <p className="mt-3 text-sm font-bold text-black/70 sm:text-base">
                        Premium drama collection for VIP users
                    </p>
                </div>
                {loading ? (
                    <LoadingState />
                ) : (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    >
                        {data.map((item, idx) => (
                            <Link
                                href={`/dramabox/detail?id=${item.bookId}`}
                                key={item.bookId}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo"
                            >
                                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f3f3f3]">
                                    <DramaImage src={item.coverWap.trim()} alt={item.bookName} priority={idx < 6} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90 z-20 pointer-events-none" />
                                    {item.corner && (
                                        <div
                                            className="absolute top-2 left-2 z-20 rounded-md px-2 py-0.5 text-[10px] font-black text-black bg-white border-[2px] border-black shadow-neo-sm"
                                            style={{ backgroundColor: item.corner.color || "#ffec99" }}
                                        >
                                            {item.corner.name}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-2 text-sm font-black text-black group-hover:text-primary leading-tight">
                                        {item.bookName}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {item.tags?.slice(0, 2).map((tag, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] rounded-full bg-[#ffec99] px-2 py-0.5 text-black font-bold border-[2px] border-black"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-white mt-2">
                                        {item.playCount && (
                                            <span className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">
                                                🔥 {item.playCount}
                                            </span>
                                        )}
                                        {item.chapterCount && (
                                            <span className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">
                                                📑 {item.chapterCount} Eps
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
