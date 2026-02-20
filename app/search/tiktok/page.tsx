"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import Image from "next/image";
import { downloadMedia } from "@/lib/downloads";

/* ─── Types ─── */
interface TikTokVideoResult {
    id: string;
    title: string;
    cover: string;
    duration: string;
    videoUrl: string;
    takenAt: string;
    region: string;
    views: string;
    likes: string;
    comments: string;
    shares: string;
    author: { nickname: string; fullname: string; avatar: string };
    music: { title: string; author: string; url: string };
}

interface TikTokPhotoResult {
    id: string;
    title: string;
    images: string[];
    takenAt: string;
    region: string;
    views: string;
    likes: string;
    comments: string;
    shares: string;
    downloads: string;
    author: { nickname: string; fullname: string; avatar: string };
    music: { title: string; author: string; url: string };
}

interface TikTokProfile {
    id: string;
    username: string;
    name: string;
    avatar: string;
    bio: string;
    link: string;
    verified: boolean;
    private: boolean;
    seller: boolean;
    region: string;
    createTime: number;
    stats: {
        followers: string;
        following: string;
        likes: string;
        videos: string;
        friends: string;
    };
}

type SearchMode = "video" | "photo" | "stalk";

export default function TikTokSearchPage() {
    const [mode, setMode] = useState<SearchMode>("video");
    const [videoResults, setVideoResults] = useState<TikTokVideoResult[]>([]);
    const [photoResults, setPhotoResults] = useState<TikTokPhotoResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState("");
    const [stalkResult, setStalkResult] = useState<TikTokProfile | null>(null);
    const [stalkError, setStalkError] = useState("");

    // Track which photo carousel index per card
    const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});

    // Proxy TikTok CDN images to bypass referrer-policy blocking
    function proxyImg(url: string) {
        if (!url) return "";
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    async function handleSearch(query: string) {
        setLoading(true);
        setHasSearched(true);
        setLastQuery(query);
        setPhotoIndexes({});

        if (mode === "video") {
            setVideoResults([]);
            try {
                const res = await fetch(`/api/search/tiktok?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.items) setVideoResults(data.items);
            } catch { /* silent */ }
        } else if (mode === "photo") {
            setPhotoResults([]);
            try {
                const res = await fetch(`/api/search/tiktokphoto?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.items) setPhotoResults(data.items);
            } catch { /* silent */ }
        } else {
            // stalk mode
            setStalkResult(null);
            setStalkError("");
            try {
                const res = await fetch(`/api/stalker/tiktok?username=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.error) {
                    setStalkError(data.error);
                } else {
                    setStalkResult(data);
                }
            } catch {
                setStalkError("Gagal mengambil data profil");
            }
        }

        setLoading(false);
    }

    function handleModeSwitch(newMode: SearchMode) {
        if (newMode === mode) return;
        setMode(newMode);
        setHasSearched(false);
        setVideoResults([]);
        setPhotoResults([]);
        setPhotoIndexes({});
        setStalkResult(null);
        setStalkError("");
    }

    function handleDownload(videoUrl: string, id: string) {
        if (!videoUrl) return;
        const url = `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=tiktok-${id}.mp4&download=true`;
        downloadMedia(null, url, `tiktok-${id}.mp4`);
    }

    function handleImageDownload(imageUrl: string, id: string, index: number) {
        if (!imageUrl) return;
        const url = `/api/proxy-download?url=${encodeURIComponent(imageUrl)}&filename=tiktok-photo-${id}-${index + 1}.webp&download=true`;
        downloadMedia(null, url, `tiktok-photo-${id}-${index + 1}.webp`);
    }

    function setPhotoIndex(id: string, index: number) {
        setPhotoIndexes((prev) => ({ ...prev, [id]: index }));
    }

    const currentResults = mode === "video" ? videoResults : photoResults;

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-black/20 ring-1 ring-black/5 dark:shadow-white/10 dark:ring-white/10">
                    <Image
                        src="/logo-tiktok.webp"
                        alt="TikTok"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover p-1"
                        priority
                    />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                    TikTok Search
                </h1>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Cari video & foto TikTok, lihat stats & download
                </p>
            </div>

            {/* ─── Video / Photo / Stalk Toggle ─── */}
            <div className="mb-6 flex items-center justify-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10 max-w-sm mx-auto">
                <button
                    onClick={() => handleModeSwitch("video")}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${mode === "video"
                        ? "bg-white text-black shadow-md"
                        : "text-neutral-400 hover:text-white"
                        }`}
                >
                    🎬 Video
                </button>
                <button
                    onClick={() => handleModeSwitch("photo")}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${mode === "photo"
                        ? "bg-white text-black shadow-md"
                        : "text-neutral-400 hover:text-white"
                        }`}
                >
                    📷 Photo
                </button>
                <button
                    onClick={() => handleModeSwitch("stalk")}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${mode === "stalk"
                        ? "bg-white text-black shadow-md"
                        : "text-neutral-400 hover:text-white"
                        }`}
                >
                    👤 Stalk
                </button>
            </div>

            <SearchBar
                placeholder={
                    mode === "video" ? "Cari video TikTok..."
                        : mode === "photo" ? "Cari foto TikTok..."
                            : "Masukkan username TikTok..."
                }
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Results */}
            <div className="mt-10">
                {/* Loading skeleton */}
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-2">
                                <div className={`skeleton mb-2 w-full rounded-lg ${mode === "video" ? "aspect-[9/16]" : "aspect-square"}`} />
                                <div className="p-2">
                                    <div className="skeleton mb-2 h-4 w-3/4" />
                                    <div className="skeleton h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── VIDEO RESULTS ─── */}
                {!loading && mode === "video" && videoResults.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {videoResults.map((r) => (
                            <div
                                key={r.id}
                                className="card-hover group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:border-cyan-500/30"
                            >
                                {/* Cover */}
                                <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-800">
                                    <img
                                        src={proxyImg(r.cover)}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
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
                                    <div className="absolute bottom-2 left-2 z-20 flex flex-col gap-0.5">
                                        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                            👁 {r.views}
                                        </span>
                                        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                            ❤️ {r.likes}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-3">
                                    <div className="mb-2 flex items-center gap-2">
                                        {r.author.avatar && (
                                            <img src={proxyImg(r.author.avatar)} alt={r.author.nickname} className="h-6 w-6 rounded-full object-cover" loading="lazy" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                        )}
                                        <p className="truncate text-xs font-semibold text-neutral-300">@{r.author.nickname}</p>
                                    </div>
                                    <h3 className="line-clamp-2 text-xs font-medium leading-tight text-neutral-400">{r.title}</h3>
                                    {r.music.title && (
                                        <p className="mt-1 truncate text-[10px] text-neutral-600">🎵 {r.music.title}</p>
                                    )}
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-600">
                                        <span>💬 {r.comments}</span>
                                        <span>↗ {r.shares}</span>
                                        {r.takenAt && <span>📅 {r.takenAt.split(" ")[0]}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDownload(r.videoUrl, r.id)}
                                        className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-neutral-200"
                                    >
                                        ⬇ Download Video
                                    </button>
                                    {r.music.url && (
                                        <button
                                            onClick={() => {
                                                const url = `/api/proxy-download?url=${encodeURIComponent(r.music.url)}&filename=tiktok-audio-${r.id}.mp3&download=true`;
                                                downloadMedia(null, url, `tiktok-audio-${r.id}.mp3`);
                                            }}
                                            className="mt-1.5 block w-full rounded-lg border border-white/10 px-3 py-2 text-center text-xs font-bold text-neutral-400 transition hover:border-white/20 hover:text-white"
                                        >
                                            🎵 Download Audio
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── PHOTO RESULTS ─── */}
                {!loading && mode === "photo" && photoResults.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {photoResults.map((r) => {
                            const currentIdx = photoIndexes[r.id] || 0;
                            const totalImages = r.images.length;
                            const currentImage = r.images[currentIdx];

                            return (
                                <div
                                    key={r.id}
                                    className="card-hover group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:border-pink-500/30"
                                >
                                    {/* Image Carousel */}
                                    <div className="relative aspect-square w-full overflow-hidden bg-neutral-800">
                                        <img
                                            src={proxyImg(currentImage)}
                                            alt={r.title}
                                            className="h-full w-full object-cover transition-all duration-300"
                                            loading="lazy"
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                        />
                                        {/* Transparent Overlay for protection */}
                                        <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

                                        {/* Carousel controls */}
                                        {totalImages > 1 && (
                                            <>
                                                {/* Prev */}
                                                {currentIdx > 0 && (
                                                    <button
                                                        onClick={() => setPhotoIndex(r.id, currentIdx - 1)}
                                                        className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {/* Next */}
                                                {currentIdx < totalImages - 1 && (
                                                    <button
                                                        onClick={() => setPhotoIndex(r.id, currentIdx + 1)}
                                                        className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Dots indicator */}
                                                <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                                                    {r.images.slice(0, 7).map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPhotoIndex(r.id, idx)}
                                                            className={`h-1.5 rounded-full transition-all ${idx === currentIdx
                                                                ? "w-4 bg-white"
                                                                : "w-1.5 bg-white/40 hover:bg-white/60"
                                                                }`}
                                                        />
                                                    ))}
                                                    {totalImages > 7 && (
                                                        <span className="text-[8px] font-bold text-white/60">+{totalImages - 7}</span>
                                                    )}
                                                </div>

                                                {/* Counter badge */}
                                                <span className="absolute top-2 right-2 z-20 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                                                    {currentIdx + 1}/{totalImages}
                                                </span>
                                            </>
                                        )}

                                        {/* Stats overlay */}
                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
                                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                👁 {r.views}
                                            </span>
                                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                ❤️ {r.likes}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-1 flex-col p-3">
                                        {/* Author */}
                                        <div className="mb-2 flex items-center gap-2">
                                            {r.author.avatar && (
                                                <img src={proxyImg(r.author.avatar)} alt={r.author.fullname} className="h-6 w-6 rounded-full object-cover" loading="lazy" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                            )}
                                            <p className="truncate text-xs font-semibold text-neutral-300">
                                                {r.author.fullname || r.author.nickname || "Unknown"}
                                            </p>
                                        </div>

                                        <h3 className="line-clamp-2 text-xs font-medium leading-tight text-neutral-400">{r.title}</h3>

                                        {r.music.title && r.music.title !== "-" && (
                                            <p className="mt-1 truncate text-[10px] text-neutral-600">🎵 {r.music.title}</p>
                                        )}

                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-600">
                                            <span>💬 {r.comments}</span>
                                            <span>↗ {r.shares}</span>
                                            <span>📥 {r.downloads}</span>
                                            {r.takenAt && <span>📅 {r.takenAt.split(" ")[0]}</span>}
                                        </div>

                                        {/* Download current image */}
                                        <button
                                            onClick={() => handleImageDownload(currentImage, r.id, currentIdx)}
                                            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-neutral-200"
                                        >
                                            ⬇ Download Foto {totalImages > 1 ? `(${currentIdx + 1}/${totalImages})` : ""}
                                        </button>

                                        {/* Download all images */}
                                        {totalImages > 1 && (
                                            <button
                                                onClick={() => {
                                                    r.images.forEach((img, idx) => {
                                                        setTimeout(() => handleImageDownload(img, r.id, idx), idx * 300);
                                                    });
                                                }}
                                                className="mt-1.5 w-full rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-neutral-400 transition hover:border-white/20 hover:text-white"
                                            >
                                                📥 Download Semua ({totalImages} foto)
                                            </button>
                                        )}

                                        {/* Music download */}
                                        {r.music.url && r.music.url !== "" && (
                                            <button
                                                onClick={() => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.music.url)}&filename=tiktok-audio-${r.id}.mp3&download=true`;
                                                    downloadMedia(null, url, `tiktok-audio-${r.id}.mp3`);
                                                }}
                                                className="mt-1.5 block w-full rounded-lg border border-white/10 px-3 py-2 text-center text-xs font-bold text-neutral-400 transition hover:border-white/20 hover:text-white"
                                            >
                                                🎵 Download Audio
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ─── STALK RESULT ─── */}
                {!loading && mode === "stalk" && stalkResult && (
                    <div className="mx-auto max-w-md">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                            {/* Profile Header */}
                            <div className="relative bg-gradient-to-br from-cyan-500/20 to-purple-500/20 px-6 pb-16 pt-8 text-center">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                            </div>
                            {/* Avatar - overlapping */}
                            <div className="-mt-12 flex justify-center">
                                <div className="relative">
                                    <img
                                        src={proxyImg(stalkResult.avatar)}
                                        alt={stalkResult.username}
                                        className="h-24 w-24 rounded-full border-4 border-neutral-900 object-cover shadow-xl"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {stalkResult.verified && (
                                        <span className="absolute -right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs text-white shadow">✓</span>
                                    )}
                                    {stalkResult.private && (
                                        <span className="absolute -left-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow">🔒</span>
                                    )}
                                </div>
                            </div>

                            {/* Name + Username */}
                            <div className="mt-3 text-center px-6">
                                <h2 className="text-lg font-black text-white">
                                    {stalkResult.name || stalkResult.username}
                                </h2>
                                <p className="text-sm text-neutral-400">@{stalkResult.username}</p>
                                {stalkResult.bio && stalkResult.bio !== "-" && (
                                    <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{stalkResult.bio}</p>
                                )}
                                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-neutral-600">
                                    {stalkResult.region && (
                                        <span className="rounded bg-white/5 px-2 py-0.5">🌍 {stalkResult.region.toUpperCase()}</span>
                                    )}
                                    {stalkResult.seller && (
                                        <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-yellow-400">🏪 Seller</span>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="mt-4 grid grid-cols-5 border-t border-white/5 divide-x divide-white/5">
                                {[
                                    { label: "Followers", value: stalkResult.stats.followers },
                                    { label: "Following", value: stalkResult.stats.following },
                                    { label: "Likes", value: stalkResult.stats.likes },
                                    { label: "Videos", value: stalkResult.stats.videos },
                                    { label: "Friends", value: stalkResult.stats.friends },
                                ].map((s) => (
                                    <div key={s.label} className="py-4 text-center">
                                        <p className="text-sm font-black text-white">{s.value}</p>
                                        <p className="text-[10px] text-neutral-500">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Action */}
                            {stalkResult.link && (
                                <div className="p-4">
                                    <a
                                        href={stalkResult.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
                                    >
                                        Buka Profil TikTok ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stalk error */}
                {!loading && mode === "stalk" && stalkError && (
                    <div className="mt-10 text-center">
                        <p className="text-lg font-bold text-red-400">❌ {stalkError}</p>
                        <p className="mt-1 text-sm text-neutral-600">Pastikan username benar</p>
                    </div>
                )}

                {/* No results */}
                {!loading && hasSearched && mode !== "stalk" && currentResults.length === 0 && (
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
