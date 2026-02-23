"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";

/* ── Types ── */
interface SearchResult {
    bookId: string;
    title: string;
    cover: string;
    description: string;
    chapterCount: number;
    tag: string[];
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
function DramaCard({ drama, index }: { drama: SearchResult; index: number }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
        >
            <Link
                href={`/reelshort/watch?id=${drama.bookId}`}
                className="group block"
            >
                {/* Poster */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-red-500/30 group-hover:shadow-lg group-hover:shadow-red-500/10">
                    <Image
                        src={drama.cover}
                        alt={drama.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Episode count */}
                    <div className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                        {drama.chapterCount} Ep
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
                        {drama.title}
                    </h3>
                    {drama.tag && drama.tag.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {drama.tag.slice(0, 2).map((t, i) => (
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
    totalResults,
    onPageChange,
}: {
    currentPage: number;
    totalResults: number;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.ceil(totalResults / 10);
    if (totalPages <= 1) return null;

    const getPageNumbers = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push("...");
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push("...");
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push("...");
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push("...");
            pages.push(totalPages);
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
                                ? "bg-red-600 text-white shadow-lg shadow-red-500/20 ring-1 ring-red-500/30"
                                : "bg-white/[0.05] text-neutral-400 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] hover:text-white ring-1 ring-white/[0.06]"
            >
                Next →
            </button>
        </div>
    );
}

/* ── Main Page ── */
export default function ReelShortSearchPage() {
    const [query, setQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const doSearch = useCallback(async (q: string, p: number) => {
        if (!q.trim()) return;
        setLoading(true);
        setHasSearched(true);

        try {
            const res = await fetch(`/api/reelshort/search?query=${encodeURIComponent(q)}&page=${p}`);
            const json = await res.json();

            if (json.success) {
                setResults(json.results || []);
                setTotal(json.total || 0);
                setPage(p);
                setSearchQuery(q);
            } else {
                setResults([]);
                setTotal(0);
            }
        } catch (err) {
            console.error("Search error:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            doSearch(query, 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePageChange = (newPage: number) => {
        doSearch(searchQuery, newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

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
                        {/* Breadcrumb */}
                        <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
                            <Link href="/reelshort" className="hover:text-white transition-colors">
                                ReelShort
                            </Link>
                            <span>/</span>
                            <span className="text-neutral-300">Cari Drama</span>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                                    Cari <span className="text-red-500">Drama</span>
                                </h1>
                                <p className="text-xs text-neutral-400">
                                    Temukan drama yang kamu suka
                                </p>
                            </div>
                        </div>

                        {/* Search Form */}
                        <form onSubmit={handleSubmit} className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Cari drama... (contoh: ceo, cinta, balas dendam)"
                                        className="w-full rounded-xl bg-white/[0.05] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 ring-1 ring-white/[0.08] focus:outline-none focus:ring-red-500/50 transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!query.trim() || loading}
                                    className="rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        "Cari"
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Search stats */}
                        {hasSearched && !loading && (
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center gap-4 rounded-xl bg-white/[0.03] px-4 py-2.5 ring-1 ring-white/[0.06]"
                            >
                                <span className="text-xs text-neutral-500">
                                    &quot;{searchQuery}&quot;
                                </span>
                                <span className="text-neutral-700">•</span>
                                <span className="text-xs text-neutral-500">
                                    {formatCount(total)} hasil ditemukan
                                </span>
                                {total > 10 && (
                                    <>
                                        <span className="text-neutral-700">•</span>
                                        <span className="text-xs text-neutral-500">
                                            Halaman {page}
                                        </span>
                                    </>
                                )}
                            </m.div>
                        )}
                    </m.div>

                    {/* Loading */}
                    {loading && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    )}

                    {/* Results Grid */}
                    {!loading && results.length > 0 && (
                        <>
                            <m.div
                                key={`${searchQuery}-${page}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                            >
                                {results.map((drama, idx) => (
                                    <DramaCard
                                        key={drama.bookId}
                                        drama={drama}
                                        index={idx}
                                    />
                                ))}
                            </m.div>

                            <Pagination
                                currentPage={page}
                                totalResults={total}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}

                    {/* Empty State */}
                    {!loading && hasSearched && results.length === 0 && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[40vh] flex-col items-center justify-center text-center"
                        >
                            <div className="mb-4 text-5xl">🔍</div>
                            <h2 className="text-xl font-bold text-white">
                                Tidak ada hasil
                            </h2>
                            <p className="mt-2 text-sm text-neutral-400">
                                Coba kata kunci lain
                            </p>
                        </m.div>
                    )}

                    {/* Initial State (no search yet) */}
                    {!loading && !hasSearched && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex min-h-[40vh] flex-col items-center justify-center text-center"
                        >
                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-600/10 ring-1 ring-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-red-500">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                Cari drama favoritmu
                            </h2>
                            <p className="mt-2 text-sm text-neutral-400 max-w-sm">
                                Ketik judul, genre, atau kata kunci untuk menemukan drama yang kamu cari
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {["CEO", "Cinta", "Balas Dendam", "Keluarga", "Komedi"].map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setQuery(tag);
                                            doSearch(tag, 1);
                                        }}
                                        className="rounded-full bg-white/[0.05] px-4 py-2 text-xs font-medium text-neutral-300 ring-1 ring-white/[0.08] transition hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/20"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </m.div>
                    )}
                </div>
            </div>
        </LazyMotion>
    );
}
