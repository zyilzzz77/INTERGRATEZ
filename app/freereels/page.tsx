"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

/* ── Types ── */
interface OperationTag {
    text: string;
    text_color: string;
    bg_start: string;
    bg_end: string;
}

interface EpisodeInfo {
    id: string;
    name: string;
    cover: string;
    external_audio_h264_m3u8: string;
    external_audio_h265_m3u8: string;
    duration: number;
    video_type: string;
}

interface FreeReelsItem {
    key: string;
    cover: string;
    title: string;
    desc: string;
    tag: string[] | null;
    series_tag: string[] | null;
    content_tags: string[] | null;
    operation_tags?: OperationTag[] | null;
    episode_count: number;
    follow_count: number;
    episode_info: EpisodeInfo | null;
    is_preview?: boolean;
    booking_count?: number;
    listing_time?: number;
}

interface HomepageSection {
    type: string;
    module_name: string;
    module_key: string;
    module_desc: string;
    show_title: boolean;
    items: FreeReelsItem[];
}

/* ── Skeleton Loader ── */
function SkeletonCard() {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="aspect-[2/3] w-full animate-pulse bg-white/5" />
            <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/5" />
            </div>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/* ── Drama Card ── */
function DramaCard({ item }: { item: FreeReelsItem }) {
    const isComingSoon = item.is_preview;
    const href = isComingSoon ? "#" : `/freereels/watch?key=${item.key}`;

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <Link
            href={href}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-xl hover:shadow-white/[0.03] cursor-pointer"
        >
            {/* Cover */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                <img
                    src={item.cover}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />

                {/* Operation Tags (Dubbing, Popular, etc.) */}
                {item.operation_tags && item.operation_tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex gap-1">
                        {item.operation_tags.map((ot, idx) => (
                            <span
                                key={idx}
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md backdrop-blur-sm"
                                style={{
                                    color: ot.text_color,
                                    background: `linear-gradient(135deg, ${ot.bg_start}, ${ot.bg_end})`,
                                }}
                            >
                                {ot.text}
                            </span>
                        ))}
                    </div>
                )}

                {/* Coming Soon badge */}
                {isComingSoon && (
                    <div className="absolute top-2 right-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
                        Segera
                    </div>
                )}

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/90">
                        {item.episode_info && !isComingSoon ? (
                            <>
                                <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                                    ▶ {formatDuration(item.episode_info.duration)}
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                                    📑 {item.episode_count} Ep
                                </span>
                            </>
                        ) : (
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                                📑 {item.episode_count} Ep
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-[13px] font-bold text-white leading-tight group-hover:text-neutral-300 transition-colors">
                    {item.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-neutral-500">
                    {item.follow_count > 0 && (
                        <span>♥ {item.follow_count.toLocaleString()}</span>
                    )}
                    {item.booking_count && item.booking_count > 0 && (
                        <span>🔔 {item.booking_count.toLocaleString()}</span>
                    )}
                </div>
                {/* Content tags */}
                {item.content_tags && item.content_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {item.content_tags.slice(0, 2).map((tag, idx) => (
                            <span
                                key={idx}
                                className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[9px] text-neutral-400"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}

/* ── Section Component ── */
function Section({ section }: { section: HomepageSection }) {
    return (
        <div className="mb-12">
            {section.show_title && section.module_name && (
                <div className="mb-5">
                    <h2 className="text-xl font-black text-white sm:text-2xl tracking-tight">
                        {section.module_name}
                    </h2>
                    {section.module_desc && (
                        <p className="mt-1 text-xs text-neutral-500">{section.module_desc}</p>
                    )}
                </div>
            )}

            {/* Coming Soon → horizontal scroll */}
            {section.type === "coming_soon" ? (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                    {section.items.map((item) => (
                        <div key={item.key} className="w-[140px] sm:w-[160px] flex-shrink-0">
                            <DramaCard item={item} />
                        </div>
                    ))}
                </div>
            ) : section.type === "recommend" ? (
                /* Recommend section */
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {section.items
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .filter((item: any) => item.item_type !== "card" && item.cover)
                        .map((item) => (
                            <DramaCard key={item.key} item={item} />
                        ))}
                </div>
            ) : (
                /* Default grid */
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {section.items.map((item) => (
                        <DramaCard key={item.key} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Pagination ── */
function Pagination({
    currentPage,
    onPageChange,
    hasNext,
}: {
    currentPage: number;
    onPageChange: (page: number) => void;
    hasNext: boolean;
}) {
    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];

        if (currentPage <= 4) {
            for (let i = 1; i <= Math.min(5, currentPage + 2); i++) pages.push(i);
            if (hasNext || currentPage < 5) {
                pages.push("...");
                pages.push(currentPage + 3);
            }
        } else {
            pages.push(1);
            pages.push("...");
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                if (i > 1) pages.push(i);
            }
            if (hasNext) {
                pages.push("...");
                pages.push(currentPage + 2);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
            >
                ← Prev
            </button>

            {pageNumbers.map((p, i) =>
                p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-neutral-600 select-none">
                        ···
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${p === currentPage
                                ? "bg-white text-black shadow-lg shadow-white/10 ring-1 ring-white/30"
                                : "bg-white/[0.05] text-neutral-400 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
            >
                Next →
            </button>
        </div>
    );
}

/* ── Main Page ── */
export default function FreeReelsPage() {
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasNext, setHasNext] = useState(true);

    const fetchPage = useCallback(async (pageNum: number) => {
        setLoading(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        try {
            const res = await fetch(`/api/freereels?page=${pageNum}`);
            const json = await res.json();
            if (json.code === 200 && json.data?.items) {
                setSections(json.data.items);
                setPage(pageNum);
                // Check if we got meaningful content
                const totalItems = json.data.items.reduce(
                    (sum: number, sec: HomepageSection) => sum + (sec.items?.length || 0),
                    0
                );
                setHasNext(totalItems >= 5);
            } else {
                setSections([]);
                setHasNext(false);
            }
        } catch (error) {
            console.error("Failed to fetch FreeReels data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        fetchPage(newPage);
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12 text-center"
                >
                    {/* Logo */}
                    <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl shadow-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                            <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
                            <line x1="7" x2="7" y1="2" y2="22" />
                            <line x1="17" x2="17" y1="2" y2="22" />
                            <line x1="2" x2="22" y1="12" y2="12" />
                            <line x1="2" x2="7" y1="7" y2="7" />
                            <line x1="2" x2="7" y1="17" y2="17" />
                            <line x1="17" x2="22" y1="7" y2="7" />
                            <line x1="17" x2="22" y1="17" y2="17" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-black text-white sm:text-4xl tracking-tight">
                        Free<span className="text-neutral-400">Reels</span>
                    </h1>
                    <p className="mt-3 text-sm text-neutral-500 sm:text-base max-w-md mx-auto">
                        Nonton drama populer gratis — tanpa aplikasi, tanpa registrasi
                    </p>

                    {/* Stats bar */}
                    <div className="mt-6 inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-xs text-neutral-400 backdrop-blur-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Gratis
                        </span>
                        <span className="h-3 w-px bg-white/10" />
                        <span>Sub Indo</span>
                        <span className="h-3 w-px bg-white/10" />
                        <span>Halaman {page}</span>
                    </div>
                </m.div>

                {/* Content */}
                {loading ? (
                    <LoadingGrid />
                ) : (
                    <m.div
                        key={page}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {sections.map((section, idx) => (
                            <Section key={section.module_key || idx} section={section} />
                        ))}

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            onPageChange={handlePageChange}
                            hasNext={hasNext}
                        />
                    </m.div>
                )}
            </div>
        </LazyMotion>
    );
}
