"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    video_url?: string;
    duration?: number;
}

interface PinterestImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

function PinterestImage({ src, fallbackSrc, alt, className, style, ...props }: PinterestImageProps) {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc || "");
    const [hasError, setHasError] = useState(false);

    if (!imgSrc) return null;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            style={style}
            onError={(e) => {
                if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
                    setImgSrc(fallbackSrc);
                    setHasError(true);
                }
                props.onError?.(e);
            }}
            {...props}
        />
    );
}

export default function PinterestSearchPage() {
    const [searchType, setSearchType] = useState<"photo" | "video">("photo");
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
                `/api/search/pinterest?q=${encodeURIComponent(query)}&type=${searchType}`
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

            {/* Type Toggle */}
            <div className="mb-6 flex justify-center gap-2">
                <button
                    onClick={() => {
                        if (searchType === "photo") return;
                        setSearchType("photo");
                        setResults([]);
                        setHasSearched(false);
                    }}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${searchType === "photo"
                        ? "bg-white text-black shadow-lg shadow-white/20"
                        : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                >
                    Photo
                </button>
                <button
                    onClick={() => {
                        if (searchType === "video") return;
                        setSearchType("video");
                        setResults([]);
                        setHasSearched(false);
                    }}
                    className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${searchType === "video"
                        ? "bg-white text-black shadow-lg shadow-white/20"
                        : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                >
                    Video
                </button>
            </div>

            <SearchBar
                placeholder={`Cari ${searchType === "photo" ? "gambar" : "video"} di Pinterest...`}
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
                                    <PinterestImage
                                        key={r.image}
                                        src={r.image}
                                        fallbackSrc={r.image_original}
                                        alt={r.title || r.description || "Pinterest image"}
                                        className="w-full"
                                        loading="lazy"
                                        style={{ backgroundColor: r.dominant_color || "#27272a", minHeight: "150px" }}
                                        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
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
                                            {r.pinner.image_small_url && (
                                                <img
                                                    src={r.pinner.image_small_url}
                                                    alt={r.pinner.full_name}
                                                    className="h-4 w-4 rounded-full"
                                                    loading="lazy"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    draggable={false}
                                                />
                                            )}
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
                                <div className="flex flex-col gap-1 px-2.5 pb-2.5">
                                    <div className="flex gap-1">
                                        {r.type === 'video' && r.video_url ? (
                                            <Link
                                                href={`/pinterest/watch?v=${btoa(r.video_url)}&title=${encodeURIComponent(r.title || r.description || "-")}&pinnerName=${encodeURIComponent(r.pinner?.full_name || "-")}&pinnerAvatar=${btoa(r.pinner?.image_small_url || "")}&pinId=${r.id}`}
                                                className="flex-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-center text-[11px] font-bold text-white transition hover:bg-red-600 flex items-center justify-center gap-1"
                                            >
                                                ▶ Play Video
                                            </Link>
                                        ) : r.image_original ? (
                                            <button
                                                onClick={(e) => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.image_original)}&filename=pinterest-${r.id}.jpg&download=true`;
                                                    downloadMedia(e, url, `pinterest-${r.id}.jpg`);
                                                }}
                                                className="flex-1 rounded-lg bg-white px-2.5 py-1.5 text-center text-[11px] font-bold text-black transition hover:bg-neutral-200"
                                            >
                                                ⬇ Download
                                            </button>
                                        ) : null}
                                        {r.pin_url && (
                                            <a
                                                href={r.pin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 transition hover:border-pink-500/30 hover:text-pink-400 flex items-center justify-center"
                                            >
                                                ↗ Pin
                                            </a>
                                        )}
                                    </div>
                                    {r.type === 'video' && r.video_url && (
                                        <button
                                            onClick={async () => {
                                                const { showToast } = await import("@/components/Toast");
                                                showToast("Sedang Memproses video... Tunggu Hingga Maksimal 2 menit", "info");

                                                try {
                                                    const url = `/api/convert-m3u8?url=${encodeURIComponent(r.video_url!)}`;
                                                    const response = await fetch(url);

                                                    if (!response.ok) {
                                                        throw new Error("Gagal memproses video");
                                                    }

                                                    showToast("Video berhasil diproses. Sedang mendownload...", "success");

                                                    const blob = await response.blob();
                                                    const downloadUrl = window.URL.createObjectURL(blob);

                                                    const a = document.createElement('a');
                                                    a.style.display = 'none';
                                                    a.href = downloadUrl;
                                                    a.download = `pinterest-video-${r.id}.mp4`;
                                                    document.body.appendChild(a);
                                                    a.click();

                                                    setTimeout(() => {
                                                        document.body.removeChild(a);
                                                        window.URL.revokeObjectURL(downloadUrl);
                                                        showToast("Download Video Selesai!", "success");
                                                    }, 100);

                                                } catch (error) {
                                                    console.error("Video conversion download error:", error);
                                                    showToast("Gagal mengunduh video.", "error");
                                                }
                                            }}
                                            className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-center text-[11px] font-bold text-white transition hover:bg-white/20 mt-1"
                                        >
                                            ⬇ Download Video (.mp4)
                                        </button>
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
