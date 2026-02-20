"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { downloadMedia } from "@/lib/downloads";

interface BilibiliResult {
    title: string;
    views: string;
    author: string;
    creatorUrl: string;
    duration: string;
    thumbnail: string;
    videoUrl: string;
}

export default function BilibiliSearchPage() {
    const [results, setResults] = useState<BilibiliResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState("");
    
    // Video player state
    // We moved the player to /search/bilibili/watch so we don't need this state anymore
    // but I'll keep the function signature for handleWatch to redirect instead

    const router = useRouter();

    async function handleSearch(query: string) {
        // If query looks like a Bilibili URL, use handleWatch directly
        if (query.match(/bilibili\.tv\/.*\/video\//) || query.match(/bilibili\.com\/video\//)) {
            handleWatch(query);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        setLastQuery(query);
        setResults([]);

        try {
            const res = await fetch(
                `/api/search/bilibili?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) setResults(data.items);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    function handleWatch(url: string) {
        if (!url) return;

        // Try to extract ID to make URL shorter
        const match = url.match(/video\/(\d+)/);
        const queryParam = lastQuery ? `&q=${encodeURIComponent(lastQuery)}` : "";

        if (match && match[1]) {
            router.push(`/search/bilibili/watch?id=${match[1]}${queryParam}`);
        } else {
            router.push(`/search/bilibili/watch?url=${encodeURIComponent(url)}${queryParam}`);
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-2xl text-white shadow-lg ring-1 ring-white/20 overflow-hidden">
                    <Image src="/logo-bilibili.webp" alt="Bilibili" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Bilibili <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari video dari Bilibili, lihat durasi & views
                </p>
            </div>

            <SearchBar
                placeholder="Cari video atau tempel link Bilibili..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Loading */}
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
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

                {/* Results grid */}
                {!loading && results.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((r, idx) => (
                            <div
                                key={idx}
                                className="card-hover group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:border-sky-500/30"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                                    <img
                                        src={r.thumbnail}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                    
                                    {r.duration && (
                                        <span className="absolute bottom-2 right-2 z-20 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                            {r.duration}
                                        </span>
                                    )}
                                    {r.views && (
                                        <span className="absolute bottom-2 left-2 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                            👁 {r.views.replace("· ", "")}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-200 group-hover:text-white">
                                        {r.title}
                                    </h3>

                                    <p className="mt-1.5 truncate text-xs text-neutral-500">
                                        👤 {r.author}
                                    </p>

                                    {/* Actions */}
                                    <div className="mt-3 flex gap-2">
                                        {r.videoUrl && (
                                            <button
                                                onClick={() => handleWatch(r.videoUrl)}
                                                className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-center text-xs font-bold text-white transition hover:from-sky-600 hover:to-sky-700"
                                            >
                                                ▶ Watch
                                            </button>
                                        )}
                                        {r.videoUrl && (
                                            <button
                                                onClick={(e) => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.videoUrl)}&filename=bilibili-video.mp4&download=true`;
                                                    downloadMedia(e, url, "bilibili-video.mp4");
                                                }}
                                                className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-xs font-bold text-black transition hover:bg-neutral-200"
                                            >
                                                ⬇ Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No results */}
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
