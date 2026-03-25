"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { downloadMedia } from "@/lib/downloads";
import { showToast } from "@/components/Toast";

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
            showToast("Mencari inspirasi...", "info");
            const res = await fetch(
                `/api/search/pinterest?q=${encodeURIComponent(query)}&type=${searchType}`
            );
            const data = await res.json();

            if (data.comingSoon) {
                setComingSoon(true);
                setComingSoonMsg(data.message || "Coming Soon!");
                showToast("Fitur ini akan segera hadir!", "info");
            } else if (data.items) {
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

    function getTotalReactions(counts: Record<string, number>): number {
        return Object.values(counts || {}).reduce((a, b) => a + b, 0);
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 text-black">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffcdd2] shadow-neo">
                    <Image
                        src="/logo-pinterest.webp"
                        alt="Pinterest"
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                    />
                </div>
                <h1 className="text-3xl font-black">Pinterest Search</h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    Cari foto dan video inspirasi dengan gaya neobrutalism
                </p>
            </div>

            {/* Type Toggle */}
            <div className="mb-6 flex justify-center gap-2">
                {[{ key: "photo", label: "Photo", color: "#ffeb3b" }, { key: "video", label: "Video", color: "#b3e5fc" }].map((item) => {
                    const active = searchType === item.key;
                    return (
                        <button
                            key={item.key}
                            onClick={() => {
                                if (searchType === item.key) return;
                                setSearchType(item.key as typeof searchType);
                                setResults([]);
                                setHasSearched(false);
                            }}
                            className={`rounded-xl border-[3px] border-black px-4 py-2 text-sm font-black shadow-neo-sm transition-all ${active ? "bg-white" : "hover:-translate-y-0.5 hover:-translate-x-0.5"}`}
                            style={{ backgroundColor: active ? undefined : item.color }}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
                <SearchBar
                    placeholder={`Cari ${searchType === "photo" ? "gambar" : "video"} di Pinterest...`}
                    onSearch={handleSearch}
                    loading={loading}
                />
            </div>

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
                    <div className="mt-16 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffe4e1] text-3xl shadow-neo">
                            🚧
                        </div>
                        <p className="text-xl font-black text-black">{comingSoonMsg}</p>
                        <p className="mt-2 text-sm font-bold text-black/70">
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
                                className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo"
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
                                <div className="p-3">
                                    {r.title && (
                                        <p className="line-clamp-2 text-sm font-black text-black">
                                            {r.title}
                                        </p>
                                    )}

                                    {r.pinner?.full_name && (
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            {r.pinner.image_small_url && (
                                                <img
                                                    src={r.pinner.image_small_url}
                                                    alt={r.pinner.full_name}
                                                    className="h-5 w-5 rounded-full border border-black/10"
                                                    loading="lazy"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    draggable={false}
                                                />
                                            )}
                                            <span className="truncate text-[11px] font-bold text-black/70">
                                                {r.pinner.full_name}
                                            </span>
                                            {r.pinner.follower_count > 0 && (
                                                <span className="text-[11px] font-bold text-black/50">
                                                    · {r.pinner.follower_count.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-1.5 flex items-center gap-2 text-[11px] font-bold text-black/60">
                                        {getTotalReactions(r.reaction_counts) > 0 && (
                                            <span>❤️ {getTotalReactions(r.reaction_counts).toLocaleString()}</span>
                                        )}
                                        {r.created_at && (
                                            <span>{r.created_at}</span>
                                        )}
                                    </div>

                                    {r.board?.name && (
                                        <div className="mt-1 text-[11px] font-bold text-black/60">
                                            📋 {r.board.name}
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-1 px-3 pb-3">
                                    <div className="flex gap-2">
                                        {r.type === "video" && r.video_url ? (
                                            <Link
                                                href={`/pinterest/watch?v=${btoa(r.video_url)}&title=${encodeURIComponent(r.title || r.description || "-")}&pinnerName=${encodeURIComponent(r.pinner?.full_name || "-")}&pinnerAvatar=${btoa(r.pinner?.image_small_url || "")}&pinId=${r.id}`}
                                                className="flex-1 rounded-xl border-[3px] border-black bg-[#ffeb3b] px-3 py-2 text-center text-xs font-black text-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5"
                                            >
                                                ▶ Play Video
                                            </Link>
                                        ) : r.image_original ? (
                                            <button
                                                onClick={(e) => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.image_original)}&filename=pinterest-${r.id}.jpg&download=true`;
                                                    downloadMedia(e, url, `pinterest-${r.id}.jpg`);
                                                }}
                                                className="flex-1 rounded-xl border-[3px] border-black bg-white px-3 py-2 text-center text-xs font-black text-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5"
                                            >
                                                ⬇ Download
                                            </button>
                                        ) : null}
                                        {r.pin_url && (
                                            <a
                                                href={r.pin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-xl border-[3px] border-black bg-[#b3e5fc] px-3 py-2 text-xs font-black text-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 flex items-center justify-center"
                                            >
                                                ↗ Pin
                                            </a>
                                        )}
                                    </div>
                                    {r.type === "video" && r.video_url && (
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

                                                    const a = document.createElement("a");
                                                    a.style.display = "none";
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
                                            className="w-full rounded-xl border-[3px] border-black bg-[#ffe4e1] px-3 py-2 text-center text-xs font-black text-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5"
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
                    <div className="mt-16 text-center">
                        <p className="text-lg font-black text-black/80">
                            Tidak ada hasil ditemukan
                        </p>
                        <p className="mt-1 text-sm font-bold text-black/60">
                            Coba kata kunci yang berbeda
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
