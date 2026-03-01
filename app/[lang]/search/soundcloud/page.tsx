"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";

interface SoundCloudResult {
    id: number;
    title: string;
    artist: string;
    thumbnail: string;
    url: string;
    duration: string;
    play_count: string;
    like_count: string;
    release_date: string;
}

export default function SoundCloudPage() {
    const router = useRouter();
    const [results, setResults] = useState<SoundCloudResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    async function handleSearch(query: string) {
        setLoading(true);

        // If it looks like a URL, go direct
        if (query.match(/soundcloud\.com/)) {
            router.push(`/?url=${encodeURIComponent(query)}&auto=true`);
            return;
        }

        setHasSearched(true);
        setResults([]);

        try {
            const res = await fetch(
                `/api/search/soundcloud?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) setResults(data.items);
        } catch {
            // handled silently
        } finally {
            setLoading(false);
        }
    }

    function handleSelect(r: SoundCloudResult) {
        if (!r.url) return;
        router.push(`/?url=${encodeURIComponent(r.url)}&auto=true`);
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-2xl text-white shadow-lg ring-1 ring-white/20 overflow-hidden">
                    <Image src="/logo-soundcloud.webp" alt="SoundCloud" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white">
                    SoundCloud <span className="text-white">Search</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari & download lagu SoundCloud gratis (MP3)
                </p>
            </div>

            <SearchBar
                placeholder="Cari lagu, artis, atau paste URL..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-white/5 bg-white/5 p-3"
                            >
                                <div className="skeleton mb-3 h-16 w-16 rounded-lg" />
                                <div className="skeleton mb-2 h-4 w-3/4" />
                                <div className="skeleton h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                onClick={() => handleSelect(r)}
                                className="card-hover group flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-orange-500/30 hover:bg-orange-500/5"
                            >
                                {/* Cover */}
                                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-sm bg-neutral-800">
                                    <Image
                                        src={r.thumbnail}
                                        alt={r.title}
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                </div>

                                {/* Info */}
                                <div className="flex min-w-0 flex-1 flex-col justify-center">
                                    <h4 className="line-clamp-1 text-sm font-bold text-white group-hover:text-orange-400">
                                        {r.title}
                                    </h4>
                                    <p className="line-clamp-1 text-xs font-medium text-neutral-500">
                                        {r.artist}
                                    </p>
                                    <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-600">
                                        <span className="flex items-center gap-1">⏱ {r.duration}</span>
                                        <span className="flex items-center gap-1">▶ {r.play_count}</span>
                                        <span className="flex items-center gap-1">♥ {r.like_count}</span>
                                    </div>
                                </div>

                                {/* Action Icon */}
                                <div className="mr-2 text-neutral-600 transition-colors group-hover:text-orange-400">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                        />
                                    </svg>
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
                            Coba kata kunci lain atau paste link langsung
                        </p>
                    </div>
                )}

                {!loading && !hasSearched && (
                    <div className="mt-16 text-center">
                        <p className="text-5xl mb-4 opacity-20 grayscale">☁️</p>
                    </div>
                )}
            </div>
        </div>
    );
}
