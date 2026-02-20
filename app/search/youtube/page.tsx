"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";

interface YTResult {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channel: string;
    publishedAt: string;
    url: string;
    views: string;
    duration: string;
}

export default function YouTubeSearchPage() {
    const router = useRouter();
    const [results, setResults] = useState<YTResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentQuery, setCurrentQuery] = useState("");

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        setCurrentQuery(query);

        try {
            const res = await fetch(
                `/api/search/youtube?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) setResults(data.items);
        } catch {
            // silent error
        } finally {
            setLoading(false);
        }
    }

    const handleDownload = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        router.push(`/?url=${encodeURIComponent(url)}&auto=true`);
    };

    const handleWatch = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        router.push(`/search/youtube/watch?url=${encodeURIComponent(url)}&q=${encodeURIComponent(currentQuery)}`);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-lg shadow-red-600/20">
                    ▶
                </div>
                <h1 className="text-3xl font-black text-white">
                    YouTube <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari video, lihat durasi & views, lalu download atau tonton
                </p>
            </div>

            <SearchBar
                placeholder="Cari video YouTube..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-2">
                                <div className="skeleton mb-2 aspect-video w-full rounded-lg" />
                                <div className="p-2">
                                    <div className="skeleton mb-2 h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                onClick={(e) => handleWatch(e, r.url)}
                                className="card-hover group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 shadow-sm backdrop-blur-sm transition-all hover:border-red-500/30 hover:shadow-md"
                            >
                                {/* Thumbnail + Duration */}
                                <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                                    <img
                                        src={r.thumbnail}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                    
                                    {r.duration && (
                                        <span className="absolute bottom-1 right-1 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                            {r.duration}
                                        </span>
                                    )}
                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-red-400">
                                        {r.title}
                                    </h3>

                                    <div className="mt-2 flex items-center gap-1.5">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-neutral-400">
                                            {r.channel.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="line-clamp-1 text-xs font-medium text-neutral-400">
                                            {r.channel}
                                        </p>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between pt-3">
                                        <div className="flex flex-col text-[10px] text-neutral-500">
                                            {r.views && <span>👁 {r.views} views</span>}
                                            {r.publishedAt && <span>📅 {r.publishedAt}</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handleWatch(e, r.url)}
                                                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-500 hover:text-white"
                                                title="Watch"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                Watch
                                            </button>
                                            <button 
                                                onClick={(e) => handleDownload(e, r.url)}
                                                className="rounded-lg bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20 group-hover:text-red-300"
                                                title="Download"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <div className="mt-20 text-center">
                        <p className="text-lg font-bold text-neutral-500">
                            Tidak ada hasil ditemukan
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                            Coba kata kunci yang berbeda
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
