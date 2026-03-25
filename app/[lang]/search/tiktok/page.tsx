"use client";

import { useState, useRef, FormEvent } from "react";
import Image from "next/image";
import { downloadMedia } from "@/lib/downloads";
import { showToast } from "@/components/Toast";

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
    const [query, setQuery] = useState("");
    const [videoResults, setVideoResults] = useState<TikTokVideoResult[]>([]);
    const [photoResults, setPhotoResults] = useState<TikTokPhotoResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState("");
    const [stalkResult, setStalkResult] = useState<TikTokProfile | null>(null);
    const [stalkError, setStalkError] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);

    // Track which photo carousel index per card
    const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});
    const swipeState = useRef<Record<string, { startX: number; startY: number; lastX: number; isSwiping: boolean }>>({});

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
                showToast("Mencari video...", "info");
                const res = await fetch(`/api/search/tiktok?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.items) {
                    setVideoResults(data.items);
                    showToast("Pencarian selesai", "success");
                } else {
                    showToast("Video tidak ditemukan", "info");
                }
            } catch { showToast("Gagal mencari video", "error"); }
        } else if (mode === "photo") {
            setPhotoResults([]);
            try {
                showToast("Mencari foto...", "info");
                const res = await fetch(`/api/search/tiktokphoto?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.items) {
                    setPhotoResults(data.items);
                    showToast("Pencarian selesai", "success");
                } else {
                    showToast("Foto tidak ditemukan", "info");
                }
            } catch { showToast("Gagal mencari foto", "error"); }
        } else {
            // stalk mode
            setStalkResult(null);
            setStalkError("");
            try {
                showToast("Mencari profil...", "info");
                const res = await fetch(`/api/stalker/tiktok?username=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.error) {
                    setStalkError(data.error);
                    showToast(data.error, "error");
                } else {
                    setStalkResult(data);
                    showToast("Profil ditemukan", "success");
                }
            } catch {
                setStalkError("Gagal mengambil data profil");
                showToast("Gagal mengambil data profil", "error");
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
        setQuery("");
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

    function handleTouchStart(id: string, e: React.TouchEvent<HTMLDivElement>) {
        const t = e.touches[0];
        swipeState.current[id] = {
            startX: t.clientX,
            startY: t.clientY,
            lastX: t.clientX,
            isSwiping: false,
        };
    }

    function handleTouchMove(id: string, totalImages: number, e: React.TouchEvent<HTMLDivElement>) {
        const state = swipeState.current[id];
        if (!state) return;
        const t = e.touches[0];
        state.lastX = t.clientX;
        const dx = t.clientX - state.startX;
        const dy = t.clientY - state.startY;
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
            state.isSwiping = true;
        }
        if (state.isSwiping) {
            e.preventDefault();
            const threshold = 24;
            if (Math.abs(dx) > threshold) {
                const currentIdx = photoIndexes[id] || 0;
                if (dx < 0 && currentIdx < totalImages - 1) {
                    setPhotoIndex(id, currentIdx + 1);
                } else if (dx > 0 && currentIdx > 0) {
                    setPhotoIndex(id, currentIdx - 1);
                }
                state.startX = t.clientX;
                state.startY = t.clientY;
                state.lastX = t.clientX;
            }
        }
    }

    function handleTouchEnd(id: string, totalImages: number) {
        const state = swipeState.current[id];
        if (!state) return;
        const dx = state.lastX - state.startX;
        const threshold = 40;
        if (state.isSwiping && Math.abs(dx) > threshold) {
            const currentIdx = photoIndexes[id] || 0;
            if (dx < 0 && currentIdx < totalImages - 1) {
                setPhotoIndex(id, currentIdx + 1);
            } else if (dx > 0 && currentIdx > 0) {
                setPhotoIndex(id, currentIdx - 1);
            }
        }
        delete swipeState.current[id];
    }

    const currentResults = mode === "video" ? videoResults : photoResults;

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black bg-[#b3e5fc] text-2xl font-black text-black shadow-neo">
                    🎵
                </div>
                <h1 className="text-3xl font-black text-black">
                    TikTok Search
                </h1>
                <p className="mt-2 text-sm font-bold text-black/70">
                    Cari video, foto, atau profil TikTok lalu unduh cepat
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-6 flex items-center justify-center gap-2">
                {["video", "photo", "stalk"].map((m) => {
                    const labels: Record<SearchMode, string> = { video: "🎬 Video", photo: "📷 Photo", stalk: "👤 Stalk" };
                    const isActive = mode === m;
                    return (
                        <button
                            key={m}
                            onClick={() => handleModeSwitch(m as SearchMode)}
                            className={`flex-1 rounded-xl border-[3px] border-black px-4 py-2 text-sm font-black transition-all shadow-neo-sm ${isActive ? "bg-[#ffeb3b] text-black" : "bg-white text-black hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"}`}
                        >
                            {labels[m as SearchMode]}
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <form
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    handleSearch(query.trim());
                }}
                className="mx-auto w-full max-w-xl"
            >
                <div className="flex overflow-hidden rounded-xl border-[3px] border-black bg-white shadow-neo transition-all focus-within:shadow-neo-sm focus-within:-translate-y-1 focus-within:-translate-x-1">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                showToast("Membaca clipboard...", "info");
                                const text = await navigator.clipboard.readText();
                                if (text) setQuery(text);
                                else showToast("Clipboard kosong", "error");
                            } catch {
                                inputRef.current?.focus();
                                showToast("Clipboard tidak diizinkan", "error");
                            }
                        }}
                        className="flex items-center justify-center px-4 md:px-5 pl-5 md:pl-6 text-black/50 hover:text-black transition-colors"
                        title="Paste dari clipboard"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 4h6M9 8h6" />
                            <rect x="5" y="4" width="14" height="16" rx="2" ry="2" />
                        </svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                            mode === "video"
                                ? "Tempel link atau judul video TikTok..."
                                : mode === "photo"
                                    ? "Cari foto TikTok..."
                                    : "Masukkan username TikTok..."
                        }
                        className="flex-1 bg-transparent px-2 py-4 text-sm font-bold text-black outline-none placeholder:text-black/50 placeholder:font-medium"
                    />
                    <div className="m-2 md:m-2.5 mr-2 md:mr-3 flex gap-1.5">
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="flex items-center gap-2 rounded-xl bg-[#ffeb3b] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <circle cx="11" cy="11" r="7" />
                                    <path strokeLinecap="round" d="m16 16 4 4" />
                                </svg>
                            )}
                            Cari
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setVideoResults([]);
                                setPhotoResults([]);
                                setStalkResult(null);
                                setHasSearched(false);
                                setStalkError("");
                            }}
                            className="flex items-center gap-2 rounded-xl bg-[#b3e5fc] px-4 md:px-5 py-2.5 text-xs md:text-sm font-black text-black transition-all border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </form>

            {/* Results */}
            <div className="mt-10">
                {/* Loading skeleton */}
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border-[3px] border-black bg-white p-2 shadow-neo">
                                <div className={`skeleton mb-2 w-full rounded-xl ${mode === "video" ? "aspect-[9/16]" : "aspect-square"}`} />
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
                                className="group flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"
                            >
                                {/* Cover */}
                                <div className="relative aspect-[9/16] w-full overflow-hidden border-b-[3px] border-black bg-[#ffece5]">
                                    <img
                                        src={proxyImg(r.cover)}
                                        alt={r.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

                                    {r.duration && (
                                        <span className="absolute bottom-2 right-2 z-20 rounded-xl border-[3px] border-black bg-white px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                            {r.duration}
                                        </span>
                                    )}
                                    <div className="absolute bottom-2 left-2 z-20 flex flex-col gap-1">
                                        <span className="inline-flex items-center gap-1 rounded-xl border-[3px] border-black bg-[#a0d1d6] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                            👁 {r.views}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-xl border-[3px] border-black bg-[#ffb3c6] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                            ❤️ {r.likes}
                                        </span>
                                    </div>
                                    <div className="absolute top-2 left-2 z-20 flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-2.5 py-1 text-xs font-black text-black shadow-neo-sm">
                                        {r.author.avatar ? (
                                            <img
                                                src={proxyImg(r.author.avatar)}
                                                alt={r.author.nickname}
                                                className="h-7 w-7 rounded-lg border-[3px] border-black object-cover"
                                                loading="lazy"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                        ) : (
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg border-[3px] border-black bg-[#c4b5fd] text-[11px] font-black text-black">
                                                {r.author.nickname.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="line-clamp-1 max-w-[120px] text-left">@{r.author.nickname}</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <h3 className="line-clamp-2 text-base font-black leading-tight text-black group-hover:text-[#ff0064]">
                                        {r.title}
                                    </h3>
                                    {r.music.title && (
                                        <p className="mt-1 truncate text-[12px] font-bold text-black/70">🎵 {r.music.title}</p>
                                    )}
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-black text-black/70">
                                        <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#ffeb3b] px-2 py-1 shadow-neo-sm">💬 {r.comments}</span>
                                        <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#b3e5fc] px-2 py-1 shadow-neo-sm">↗ {r.shares}</span>
                                        {r.takenAt && <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-white px-2 py-1 shadow-neo-sm">📅 {r.takenAt.split(" ")[0]}</span>}
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2">
                                        <button
                                            onClick={() => handleDownload(r.videoUrl, r.id)}
                                            className="w-full rounded-xl border-[3px] border-black bg-[#ffeb3b] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                        >
                                            ⬇ Download Video
                                        </button>
                                        {r.music.url && (
                                            <button
                                                onClick={() => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.music.url)}&filename=tiktok-audio-${r.id}.mp3&download=true`;
                                                    downloadMedia(null, url, `tiktok-audio-${r.id}.mp3`);
                                                }}
                                                className="w-full rounded-xl border-[3px] border-black bg-[#c4b5fd] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                            >
                                                🎵 Download Audio
                                            </button>
                                        )}
                                    </div>
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
                                    className="group flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"
                                >
                                    {/* Image Carousel */}
                                    <div
                                        className="relative aspect-square w-full overflow-hidden border-b-[3px] border-black bg-[#fff5e5]"
                                        onTouchStart={(e) => handleTouchStart(r.id, e)}
                                        onTouchMove={(e) => handleTouchMove(r.id, totalImages, e)}
                                        onTouchEnd={() => handleTouchEnd(r.id, totalImages)}
                                        style={{ touchAction: "pan-y" }}
                                    >
                                        <img
                                            src={proxyImg(currentImage)}
                                            alt={r.title}
                                            className="h-full w-full object-cover transition-all duration-300"
                                            loading="lazy"
                                            onContextMenu={(e) => e.preventDefault()}
                                            draggable={false}
                                        />
                                        <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />

                                        {/* Carousel controls */}
                                        {totalImages > 1 && (
                                            <>
                                                {currentIdx > 0 && (
                                                    <button
                                                        onClick={() => setPhotoIndex(r.id, currentIdx - 1)}
                                                        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-xl border-[3px] border-black bg-white px-2 py-1 text-black shadow-neo-sm opacity-0 transition hover:-translate-y-1 hover:-translate-x-1 group-hover:opacity-100"
                                                    >
                                                        ←
                                                    </button>
                                                )}
                                                {currentIdx < totalImages - 1 && (
                                                    <button
                                                        onClick={() => setPhotoIndex(r.id, currentIdx + 1)}
                                                        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-xl border-[3px] border-black bg-white px-2 py-1 text-black shadow-neo-sm opacity-0 transition hover:-translate-y-1 hover:-translate-x-1 group-hover:opacity-100"
                                                    >
                                                        →
                                                    </button>
                                                )}

                                                <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                                                    {r.images.slice(0, 7).map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPhotoIndex(r.id, idx)}
                                                            className={`h-2 rounded-full border-[3px] border-black transition-all ${idx === currentIdx ? "w-5 bg-[#ffeb3b]" : "w-2 bg-white"}`}
                                                        />
                                                    ))}
                                                    {totalImages > 7 && (
                                                        <span className="text-[9px] font-black text-black bg-white border-[3px] border-black rounded-full px-2 py-0.5 shadow-neo-sm">+{totalImages - 7}</span>
                                                    )}
                                                </div>

                                                <span className="absolute top-2 right-2 z-20 rounded-full border-[3px] border-black bg-white px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                                    {currentIdx + 1}/{totalImages}
                                                </span>
                                            </>
                                        )}

                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1 rounded-xl border-[3px] border-black bg-[#a0d1d6] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                                👁 {r.views}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-xl border-[3px] border-black bg-[#ffb3c6] px-2 py-1 text-[11px] font-black text-black shadow-neo-sm">
                                                ❤️ {r.likes}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-1 flex-col gap-3 p-4">
                                        <div className="flex items-center gap-2">
                                            {r.author.avatar ? (
                                                <img src={proxyImg(r.author.avatar)} alt={r.author.fullname} className="h-8 w-8 rounded-xl border-[3px] border-black object-cover" loading="lazy" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                                            ) : (
                                                <span className="flex h-8 w-8 items-center justify-center rounded-xl border-[3px] border-black bg-[#c4b5fd] text-[11px] font-black text-black">
                                                    {(r.author.fullname || r.author.nickname || "?").charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <p className="truncate text-sm font-black text-black">
                                                {r.author.fullname || r.author.nickname || "Unknown"}
                                            </p>
                                        </div>

                                        <h3 className="line-clamp-2 text-base font-black leading-tight text-black group-hover:text-[#ff0064]">{r.title}</h3>

                                        {r.music.title && r.music.title !== "-" && (
                                            <p className="mt-1 truncate text-[12px] font-bold text-black/70">🎵 {r.music.title}</p>
                                        )}

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-black text-black/70">
                                            <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#ffeb3b] px-2 py-1 shadow-neo-sm">💬 {r.comments}</span>
                                            <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#b3e5fc] px-2 py-1 shadow-neo-sm">↗ {r.shares}</span>
                                            <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-white px-2 py-1 shadow-neo-sm">📥 {r.downloads}</span>
                                            {r.takenAt && <span className="inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-white px-2 py-1 shadow-neo-sm">📅 {r.takenAt.split(" ")[0]}</span>}
                                        </div>

                                        <button
                                            onClick={() => handleImageDownload(currentImage, r.id, currentIdx)}
                                            className="mt-auto w-full rounded-xl border-[3px] border-black bg-[#ffeb3b] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                        >
                                            ⬇ Download Foto {totalImages > 1 ? `(${currentIdx + 1}/${totalImages})` : ""}
                                        </button>

                                        {totalImages > 1 && (
                                            <button
                                                onClick={() => {
                                                    r.images.forEach((img, idx) => {
                                                        setTimeout(() => handleImageDownload(img, r.id, idx), idx * 300);
                                                    });
                                                }}
                                                className="w-full rounded-xl border-[3px] border-black bg-[#c4b5fd] px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
                                            >
                                                📥 Download Semua ({totalImages} foto)
                                            </button>
                                        )}

                                        {r.music.url && r.music.url !== "" && (
                                            <button
                                                onClick={() => {
                                                    const url = `/api/proxy-download?url=${encodeURIComponent(r.music.url)}&filename=tiktok-audio-${r.id}.mp3&download=true`;
                                                    downloadMedia(null, url, `tiktok-audio-${r.id}.mp3`);
                                                }}
                                                className="w-full rounded-xl border-[3px] border-black bg-white px-3 py-2 text-xs font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
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
                        <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-neo">
                            <div className="relative bg-[#b3e5fc] px-6 pb-16 pt-8 text-center border-b-[3px] border-black">
                                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,#ffeb3b_0,transparent_35%),radial-gradient(circle_at_70%_60%,#ffb3c6_0,transparent_35%)]" />
                            </div>
                            <div className="-mt-12 flex justify-center">
                                <div className="relative">
                                    <img
                                        src={proxyImg(stalkResult.avatar)}
                                        alt={stalkResult.username}
                                        className="h-24 w-24 rounded-2xl border-[3px] border-black object-cover shadow-neo-sm"
                                        onContextMenu={(e) => e.preventDefault()}
                                        draggable={false}
                                    />
                                    {stalkResult.verified && (
                                        <span className="absolute -right-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#c4b5fd] text-xs font-black text-black shadow-neo-sm">✓</span>
                                    )}
                                    {stalkResult.private && (
                                        <span className="absolute -left-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#ffb3c6] text-xs font-black text-black shadow-neo-sm">🔒</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 px-6 text-center">
                                <h2 className="text-xl font-black text-black">{stalkResult.name || stalkResult.username}</h2>
                                <p className="text-sm font-bold text-black/70">@{stalkResult.username}</p>
                                {stalkResult.bio && stalkResult.bio !== "-" && (
                                    <p className="mt-2 text-xs font-bold text-black/70 leading-relaxed whitespace-pre-line">{stalkResult.bio}</p>
                                )}
                                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-black text-black/70">
                                    {stalkResult.region && (
                                        <span className="rounded-full border-[3px] border-black bg-white px-2 py-0.5 shadow-neo-sm">🌍 {stalkResult.region.toUpperCase()}</span>
                                    )}
                                    {stalkResult.seller && (
                                        <span className="rounded-full border-[3px] border-black bg-[#ffeb3b] px-2 py-0.5 shadow-neo-sm">🏪 Seller</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-5 divide-x-[3px] divide-black border-t-[3px] border-black">
                                {[
                                    { label: "Followers", value: stalkResult.stats.followers },
                                    { label: "Following", value: stalkResult.stats.following },
                                    { label: "Likes", value: stalkResult.stats.likes },
                                    { label: "Videos", value: stalkResult.stats.videos },
                                    { label: "Friends", value: stalkResult.stats.friends },
                                ].map((s) => (
                                    <div key={s.label} className="py-4 text-center">
                                        <p className="text-sm font-black text-black">{s.value}</p>
                                        <p className="text-[10px] font-bold text-black/60">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {stalkResult.link && (
                                <div className="p-4 border-t-[3px] border-black">
                                    <a
                                        href={stalkResult.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full rounded-xl border-[3px] border-black bg-[#ffeb3b] px-4 py-3 text-center text-sm font-black text-black transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-neo-sm"
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
                        <p className="text-lg font-black text-black/80">❌ {stalkError}</p>
                        <p className="mt-1 text-sm font-bold text-black/60">Pastikan username benar</p>
                    </div>
                )}

                {!loading && hasSearched && mode !== "stalk" && currentResults.length === 0 && (
                    <div className="mt-20 text-center">
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
