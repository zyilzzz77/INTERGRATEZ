"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { showToast } from "@/components/Toast";

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
            showToast("Mencari lagu...", "info");
            const res = await fetch(
                `/api/search/soundcloud?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
                showToast("Pencarian selesai", "success");
            } else {
                showToast("Hasil tidak ditemukan", "info");
            }
        } catch {
            showToast("Gagal melakukan pencarian", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleSelect(r: SoundCloudResult) {
        if (!r.url) return;
        router.push(`/?url=${encodeURIComponent(r.url)}&auto=true`);
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 text-black">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffd8b2] shadow-neo overflow-hidden">
                    <Image src="/logo-soundcloud.webp" alt="SoundCloud" width={56} height={56} className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black">SoundCloud Search</h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    Cari & download lagu SoundCloud gratis (MP3)
                </p>
            </div>

            <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
                <SearchBar
                    placeholder="Cari lagu, artis, atau paste URL..."
                    onSearch={handleSearch}
                    loading={loading}
                />
            </div>

            {/* Results */}
            <div className="mt-10">
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo-sm"
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
                                className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-[3px] border-black bg-white p-3 shadow-neo transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"
                            >
                                {/* Cover */}
                                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-[3px] border-black bg-white">
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
                                    <h4 className="line-clamp-1 text-sm font-black text-black group-hover:text-orange-500">
                                        {r.title}
                                    </h4>
                                    <p className="line-clamp-1 text-xs font-bold text-black/60">
                                        {r.artist}
                                    </p>
                                    <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-black/60">
                                        <span className="flex items-center gap-1">⏱ {r.duration}</span>
                                        <span className="flex items-center gap-1">▶ {r.play_count}</span>
                                        <span className="flex items-center gap-1">♥ {r.like_count}</span>
                                    </div>
                                </div>

                                {/* Action Icon */}
                                <div className="mr-2 text-black transition-colors group-hover:text-orange-500">
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
                    <div className="mt-16 text-center">
                        <p className="text-lg font-black text-black/80">
                            Tidak ada hasil ditemukan
                        </p>
                        <p className="mt-1 text-sm font-bold text-black/60">
                            Coba kata kunci lain atau paste link langsung
                        </p>
                    </div>
                )}

                {!loading && !hasSearched && (
                    <div className="mt-16 text-center">
                        <p className="text-5xl mb-4 opacity-40">☁️</p>
                    </div>
                )}
            </div>
        </div>
    );
}
