"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";

/* ── Types ── */
interface BookMark {
    type?: number;
    color?: string;
    text?: string;
    text_color?: string;
}

interface TagItem {
    tag_id: string;
    tag_name: string;
}

interface DramaItem {
    book_id: string;
    book_title: string;
    book_pic: string;
    special_desc: string;
    chapter_count: number;
    theme: string[];
    collect_count: number;
    read_count: number;
    tag_list: TagItem[];
    book_mark: BookMark;
    score: number;
}

/* ── Helpers ── */
function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

/* ── Skeleton Card ── */
function SkeletonCard() {
    return (
        <div className="animate-pulse">
            <div className="aspect-[3/4] rounded-2xl bg-neutral-800" />
            <div className="mt-3 space-y-2 px-1">
                <div className="h-4 w-3/4 rounded bg-neutral-800" />
                <div className="h-3 w-1/2 rounded bg-neutral-700" />
            </div>
        </div>
    );
}

/* ── Drama Card ── */
function DramaCard({ drama, index }: { drama: DramaItem; index: number }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
        >
            <Link
                href={`/reelshort/watch?id=${drama.book_id}`}
                className="group block"
            >
                {/* Poster */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-red-500/30 group-hover:shadow-lg group-hover:shadow-red-500/10">
                    <Image
                        src={drama.book_pic}
                        alt={drama.book_title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Badge (e.g. Dubbing) */}
                    {drama.book_mark?.text && (
                        <div
                            className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-lg"
                            style={{
                                backgroundColor: drama.book_mark.color || "#F26118",
                                color: drama.book_mark.text_color || "#FFF",
                            }}
                        >
                            {drama.book_mark.text}
                        </div>
                    )}

                    {/* Episode count */}
                    <div className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                        {drama.chapter_count} Ep
                    </div>

                    {/* Bottom info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 text-[10px] text-white/70">
                            <span>👁 {formatCount(drama.read_count)}</span>
                            <span>♥ {formatCount(drama.collect_count)}</span>
                        </div>
                    </div>

                    {/* Hover play icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-xl backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6 ml-0.5">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Title & Tags */}
                <div className="mt-2.5 px-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-white leading-snug group-hover:text-red-400 transition-colors">
                        {drama.book_title}
                    </h3>
                    {drama.theme && drama.theme.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {drama.theme.slice(0, 2).map((t, i) => (
                                <span
                                    key={i}
                                    className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        </m.div>
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
    // Generate page numbers to show
    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        const maxVisible = 7;

        if (currentPage <= 4) {
            // Show 1-5 ... next
            for (let i = 1; i <= Math.min(maxVisible - 2, currentPage + 2); i++) pages.push(i);
            if (hasNext || currentPage < maxVisible - 2) {
                pages.push("...");
                pages.push(currentPage + 3);
            }
        } else {
            // Show 1 ... current-1, current, current+1 ...
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
            {/* Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
            >
                ← Prev
            </button>

            {/* Page numbers */}
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
                            ? "bg-red-600 text-white shadow-lg shadow-red-500/20 ring-1 ring-red-500/30"
                            : "bg-white/[0.05] text-neutral-400 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next */}
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
export default function ReelShortPage() {
    const [dramas, setDramas] = useState<DramaItem[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasNext, setHasNext] = useState(true);

    const fetchPage = useCallback(async (pageNum: number) => {
        setLoading(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        try {
            const res = await fetch(`/api/reelshort?page=${pageNum}`);
            const json = await res.json();

            if (json.success && json.data?.lists) {
                const items = json.data.lists as DramaItem[];
                setDramas(items);
                setPage(pageNum);
                // If we got a full page of results (~20+), assume there's more
                setHasNext(items.length >= 10);
            } else {
                setDramas([]);
                setHasNext(false);
            }
        } catch (err) {
            console.error("Failed to fetch ReelShort:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        fetchPage(newPage);
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-black text-white">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
                    {/* Header */}
                    <m.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                        <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
                                        <line x1="7" x2="7" y1="2" y2="22" />
                                        <line x1="17" x2="17" y1="2" y2="22" />
                                        <line x1="2" x2="22" y1="12" y2="12" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                        Reel<span className="text-red-500">Short</span>
                                    </h1>
                                    <p className="text-sm text-neutral-400">
                                        Drama pendek viral — langsung tonton gratis
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/reelshort/search"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] text-neutral-400 transition hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </Link>
                        </div>

                        {/* Page indicator */}
                        {!loading && dramas.length > 0 && (
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 flex items-center gap-4 rounded-xl bg-white/[0.03] px-4 py-2.5 ring-1 ring-white/[0.06]"
                            >
                                <span className="text-xs text-neutral-500">
                                    Halaman {page}
                                </span>
                                <span className="text-neutral-700">•</span>
                                <span className="text-xs text-neutral-500">
                                    {dramas.length} drama ditampilkan
                                </span>
                            </m.div>
                        )}
                    </m.div>

                    {/* Loading */}
                    {loading && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    )}

                    {/* Drama Grid */}
                    {!loading && dramas.length > 0 && (
                        <>
                            <m.div
                                key={page}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                            >
                                {dramas.map((drama, idx) => (
                                    <DramaCard
                                        key={drama.book_id}
                                        drama={drama}
                                        index={idx}
                                    />
                                ))}
                            </m.div>

                            {/* Pagination Buttons */}
                            <Pagination
                                currentPage={page}
                                onPageChange={handlePageChange}
                                hasNext={hasNext}
                            />
                        </>
                    )}

                    {/* Empty State */}
                    {!loading && dramas.length === 0 && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[40vh] flex-col items-center justify-center text-center"
                        >
                            <div className="mb-4 text-5xl">🎬</div>
                            <h2 className="text-xl font-bold text-white">
                                Tidak ada drama
                            </h2>
                            <p className="mt-2 text-sm text-neutral-400">
                                Coba lagi nanti
                            </p>
                            <button
                                onClick={() => fetchPage(1)}
                                className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-red-500"
                            >
                                Coba Lagi
                            </button>
                        </m.div>
                    )}
                </div>
            </div>
        </LazyMotion>
    );
}
