"use client";

import { useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { downloadMedia } from "@/lib/downloads";

interface Pinner {
    username: string;
    full_name: string;
    follower_count: number;
    image_small_url: string;
}

interface Board {
    id: string;
    name: string;
    url: string;
    pin_count: number;
}

interface PinterestResult {
    id: string;
    image: string;
    image_original: string;
    title: string;
    description: string;
    pin_url: string;
    created_at: string;
    type: string;
    pinner: Pinner;
    board: Board;
    reaction_counts: Record<string, number>;
    dominant_color: string;
}

export default function PinterestSearchPage() {
    const [results, setResults] = useState<PinterestResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [comingSoon, setComingSoon] = useState(false);
    const [comingSoonMsg, setComingSoonMsg] = useState("");

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        setComingSoon(false);

        try {
            const res = await fetch(
                `/api/search/pinterest?q=${encodeURIComponent(query)}`
            );
            const data = await res.json();

            if (data.comingSoon) {
                setComingSoon(true);
                setComingSoonMsg(data.message || "Coming Soon!");
            } else if (data.items) {
                setResults(data.items);
            }
        } catch {
            // handled silently
        } finally {
            setLoading(false);
        }
    }

    function getTotalReactions(counts: Record<string, number>): number {
        return Object.values(counts || {}).reduce((a, b) => a + b, 0);
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-pink-500/20 backdrop-blur-sm">
                    <Image
                        src="/logo-pinterest.webp"
                        alt="Pinterest"
                        width={64}
                        height={64}
                        className="h-16 w-16 object-contain rounded-2xl"
                    />
                </div>
                <h1 className="text-3xl font-black text-white">
                    Pinterest Search
                </h1>
                <p className="mt-2 text-sm text-neutral-500">
                    Cari foto dan gambar inspirasi
                </p>
            </div>

            <SearchBar
                placeholder="Cari gambar di Pinterest..."
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Loading skeleton */}
                {loading && (
                    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className="skeleton mb-4 break-inside-avoid rounded-xl"
                                style={{ height: `${140 + Math.random() * 120}px` }}
                            />
                        ))}
                    </div>
                )}

                {/* Coming soon */}
                {!loading && comingSoon && (
                    <div className="mt-20 text-center">
                        <div className="float-anim mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 text-4xl text-white shadow-xl">
                            🚧
                        </div>
                        <p className="text-xl font-black text-neutral-300">{comingSoonMsg}</p>
                        <p className="mt-2 text-sm text-neutral-600">
                            Kami sedang mengembangkan fitur ini. Stay tuned!
                        </p>
                    </div>
                )}

                {/* Image grid */}
                {!loading && results.length > 0 && (
                    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                        {results.map((r) => (
                            <div
                                key={r.id}
                                className="card-hover mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm"
                            >
                                {/* Image */}
                                <div className="relative overflow-hidden">
                                    <img
                                        src={r.image}
                                        alt={r.title || r.description || "Pinterest image"}
                                        className="w-full"
                                        loading="lazy"
                                        style={{ backgroundColor: r.dominant_color || "#27272a" }}
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {/* Transparent Overlay for protection */}
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                </div>

                                {/* Info section */}
                                <div className="p-2.5">
                                    {r.title && (
                                        <p className="line-clamp-2 text-xs font-semibold text-neutral-300">
                                            {r.title}
                                        </p>
                                    )}

                                    {r.pinner?.full_name && (
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <img
                                                src={r.pinner.image_small_url}
                                                alt={r.pinner.full_name}
                                                className="h-4 w-4 rounded-full"
                                                loading="lazy"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            <span className="truncate text-[10px] text-neutral-500">
                                                {r.pinner.full_name}
                                            </span>
                                            {r.pinner.follower_count > 0 && (
                                                <span className="text-[10px] text-neutral-600">
                                                    · {r.pinner.follower_count.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-neutral-600">
                                        {getTotalReactions(r.reaction_counts) > 0 && (
                                            <span>❤️ {getTotalReactions(r.reaction_counts).toLocaleString()}</span>
                                        )}
                                        {r.created_at && (
                                            <span>{r.created_at}</span>
                                        )}
                                    </div>

                                    {r.board?.name && (
                                        <div className="mt-1 text-[10px] text-neutral-600">
                                            📋 {r.board.name}
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-1 px-2.5 pb-2.5">
                                    {r.image_original && (
                                        <button
                                            onClick={(e) => {
                                                const url = `/api/proxy-download?url=${encodeURIComponent(r.image_original)}&filename=pinterest-${r.id}.jpg&download=true`;
                                                downloadMedia(e, url, `pinterest-${r.id}.jpg`);
                                            }}
                                            className="flex-1 rounded-lg bg-white px-2.5 py-1.5 text-center text-[11px] font-bold text-black transition hover:bg-neutral-200"
                                        >
                                            ⬇ Download
                                        </button>
                                    )}
                                    {r.pin_url && (
                                        <a
                                            href={r.pin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 transition hover:border-pink-500/30 hover:text-pink-400"
                                        >
                                            ↗ Pin
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No results */}
                {!loading && hasSearched && !comingSoon && results.length === 0 && (
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
