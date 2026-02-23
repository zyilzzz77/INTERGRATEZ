"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";
import { LazyMotion, domAnimation, m } from "framer-motion";

/* ── Types ── */
interface Chapter {
    index: number;
    chapterId: string;
    title: string;
    isLocked: boolean;
    serialNumber: number;
}

interface DramaDetail {
    bookId: string;
    title: string;
    cover: string;
    description: string;
    totalEpisodes: number;
    chapters: Chapter[];
}

interface VideoSource {
    url: string;
    encode: string;
    quality: number;
    bitrate: string;
}

/* ── HLS Player Component ── */
function HlsPlayer({
    src,
    poster,
    onEnded,
}: {
    src: string;
    poster?: string;
    onEnded?: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        let hls: Hls | null = null;

        const proxiedUrl = src.includes(".m3u8")
            ? `/api/hls-proxy?url=${encodeURIComponent(src)}`
            : src;

        if (src.includes(".m3u8") && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });
            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => { });
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn("HLS network error, attempting recovery...");
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn("HLS media error, attempting recovery...");
                            hls?.recoverMediaError();
                            break;
                        default:
                            console.error("HLS fatal error:", data);
                            hls?.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = proxiedUrl;
            video.play().catch(() => { });
        } else {
            video.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return (
        <video
            ref={videoRef}
            className="h-full w-full object-contain"
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
            poster={poster}
            onEnded={onEnded}
        />
    );
}

/* ── Loading ── */
function LoadingState() {
    return (
        <LazyMotion features={domAnimation}>
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <div className="relative mb-8 flex items-center justify-center">
                    <m.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute h-28 w-28 rounded-full bg-red-500"
                    />
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-xl shadow-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                            <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
                            <line x1="7" x2="7" y1="2" y2="22" />
                            <line x1="17" x2="17" y1="2" y2="22" />
                            <line x1="2" x2="22" y1="12" y2="12" />
                        </svg>
                    </div>
                </div>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                    <m.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full w-full rounded-full bg-red-500"
                    />
                </div>
            </div>
        </LazyMotion>
    );
}

/* ── Watch Content ── */
function WatchContent() {
    const searchParams = useSearchParams();
    const bookId = searchParams.get("id");

    const [drama, setDrama] = useState<DramaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentEpIndex, setCurrentEpIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);

    // Suppress unhandled media errors
    useEffect(() => {
        const handler = (event: PromiseRejectionEvent) => {
            const name = event.reason?.name;
            if (name === "NotAllowedError" || name === "AbortError") {
                event.preventDefault();
            }
        };
        window.addEventListener("unhandledrejection", handler);
        return () => window.removeEventListener("unhandledrejection", handler);
    }, []);

    // Fetch detail data
    useEffect(() => {
        if (!bookId) return;

        async function fetchData() {
            try {
                const res = await fetch(`/api/reelshort/detail?bookId=${encodeURIComponent(bookId!)}`);
                const json = await res.json();
                if (json.success) {
                    setDrama({
                        bookId: json.bookId,
                        title: json.title,
                        cover: json.cover,
                        description: json.description,
                        totalEpisodes: json.totalEpisodes,
                        chapters: json.chapters,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch ReelShort detail:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [bookId]);

    // Fetch episode video
    const fetchEpisodeVideo = useCallback(
        async (epIndex: number) => {
            if (!drama) return;
            const chapter = drama.chapters[epIndex];
            if (!chapter || chapter.isLocked) return;

            setVideoLoading(true);
            setVideoSrc(null);

            try {
                const res = await fetch(
                    `/api/reelshort/episode?bookId=${drama.bookId}&episodeNumber=${chapter.serialNumber}`
                );
                const json = await res.json();

                if (json.success && json.videoList?.length > 0) {
                    // Prefer H264 for broader browser compat
                    const h264 = json.videoList.find(
                        (v: VideoSource) => v.encode === "H264" && v.quality > 0
                    );
                    const best =
                        h264 ||
                        json.videoList.find((v: VideoSource) => v.quality > 0) ||
                        json.videoList[0];
                    setVideoSrc(best.url);
                }
            } catch (err) {
                console.error("Failed to fetch episode video:", err);
            } finally {
                setVideoLoading(false);
            }
        },
        [drama]
    );

    const handleEpisodeSelect = useCallback(
        (index: number) => {
            setCurrentEpIndex(index);
            setIsPlaying(true);
            fetchEpisodeVideo(index);
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [fetchEpisodeVideo]
    );

    const handleNextEpisode = useCallback(() => {
        if (!drama) return;
        const nextIdx = currentEpIndex + 1;
        if (nextIdx < drama.chapters.length && !drama.chapters[nextIdx].isLocked) {
            handleEpisodeSelect(nextIdx);
        }
    }, [currentEpIndex, drama, handleEpisodeSelect]);

    const handlePrevEpisode = useCallback(() => {
        if (currentEpIndex > 0) {
            handleEpisodeSelect(currentEpIndex - 1);
        }
    }, [currentEpIndex, handleEpisodeSelect]);

    if (loading) return <LoadingState />;

    if (!drama) {
        return (
            <LazyMotion features={domAnimation}>
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Drama tidak ditemukan</h2>
                    <p className="text-neutral-400 mt-2">Silakan coba lagi nanti</p>
                    <Link
                        href="/reelshort"
                        className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-red-500"
                    >
                        Kembali
                    </Link>
                </div>
            </LazyMotion>
        );
    }

    const currentChapter = drama.chapters[currentEpIndex] || null;

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-6xl px-4 py-6 sm:py-10"
            >
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/reelshort" className="hover:text-white transition-colors">
                        ReelShort
                    </Link>
                    <span>/</span>
                    <span className="truncate text-neutral-300">{drama.title}</span>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Left Column: Player */}
                    <div className="w-full lg:w-[60%]">
                        {/* Player */}
                        <div
                            className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
                            style={{ aspectRatio: "9/16", maxHeight: "75vh" }}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {isPlaying && videoSrc ? (
                                <HlsPlayer
                                    src={videoSrc}
                                    poster={drama.cover}
                                    onEnded={handleNextEpisode}
                                />
                            ) : isPlaying && videoLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-red-500 border-t-transparent" />
                                        <span className="text-sm text-neutral-400">
                                            Memuat video...
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-full w-full">
                                    <img
                                        src={drama.cover}
                                        alt={drama.title}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                        {currentChapter && !currentChapter.isLocked ? (
                                            <button
                                                onClick={() => handleEpisodeSelect(currentEpIndex)}
                                                className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8 ml-1">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
                                                Episode belum tersedia
                                            </div>
                                        )}
                                        {currentChapter && (
                                            <p className="mt-4 text-sm font-medium text-white/80">
                                                Episode {currentChapter.serialNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Episode Navigation */}
                        {isPlaying && currentChapter && (
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.08]">
                                <button
                                    onClick={handlePrevEpisode}
                                    disabled={currentEpIndex === 0}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ← Sebelumnya
                                </button>
                                <span className="text-sm font-bold text-white">
                                    Episode {currentChapter.serialNumber} / {drama.totalEpisodes}
                                </span>
                                <button
                                    onClick={handleNextEpisode}
                                    disabled={currentEpIndex >= drama.chapters.length - 1}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Berikutnya →
                                </button>
                            </div>
                        )}

                        {/* Drama Info (below player on mobile, hidden on desktop) */}
                        <div className="mt-6 space-y-5 lg:hidden">
                            <div>
                                <h1 className="text-2xl font-black text-white leading-tight">
                                    {drama.title}
                                </h1>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-400">
                                    <span>🎬 {drama.totalEpisodes} Episode</span>
                                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Gratis</span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
                                <h3 className="mb-2 text-sm font-bold text-white">Sinopsis</h3>
                                <p className="text-sm leading-relaxed text-neutral-400">{drama.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Info + Episode List */}
                    <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full lg:w-[40%]"
                    >
                        <div className="lg:sticky lg:top-24 flex flex-col gap-5">
                            {/* Title & Stats (desktop only) */}
                            <div className="hidden lg:block">
                                <h1 className="text-2xl font-black text-white sm:text-3xl leading-tight">
                                    {drama.title}
                                </h1>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-400">
                                    <span>🎬 {drama.totalEpisodes} Episode</span>
                                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Gratis</span>
                                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">Sub Indo</span>
                                </div>
                            </div>

                            {/* Synopsis (desktop only) */}
                            <div className="hidden lg:block rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
                                <h3 className="mb-2 text-sm font-bold text-white">Sinopsis</h3>
                                <p className="text-sm leading-relaxed text-neutral-400">{drama.description}</p>
                            </div>

                            {/* Episode List */}
                            <div className="flex flex-col rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] overflow-hidden isolate">
                                <div className="flex-none border-b border-white/[0.06] p-4 bg-neutral-900/80 backdrop-blur-md z-10">
                                    <h3 className="text-sm font-bold text-white">
                                        Daftar Episode ({drama.chapters.length})
                                    </h3>
                                </div>
                                <div
                                    className="overflow-y-auto overscroll-contain p-2 space-y-1"
                                    style={{ maxHeight: "45vh" }}
                                    onWheel={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    {drama.chapters.map((ch, idx) => (
                                        <button
                                            key={ch.chapterId}
                                            onClick={() => handleEpisodeSelect(idx)}
                                            disabled={ch.isLocked}
                                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${idx === currentEpIndex && isPlaying
                                                    ? "bg-red-600 text-white shadow-lg"
                                                    : ch.isLocked
                                                        ? "opacity-40 cursor-not-allowed text-neutral-600"
                                                        : "hover:bg-white/[0.05] text-neutral-400"
                                                }`}
                                        >
                                            {/* Episode number */}
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${idx === currentEpIndex && isPlaying
                                                        ? "bg-white/20 text-white"
                                                        : "bg-white/[0.06] text-neutral-500"
                                                    }`}
                                            >
                                                {ch.serialNumber}
                                            </div>

                                            {/* Episode info */}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-xs font-semibold truncate ${idx === currentEpIndex && isPlaying
                                                            ? "text-white"
                                                            : "text-neutral-300"
                                                        }`}
                                                >
                                                    Episode {ch.serialNumber}
                                                </p>
                                                <p
                                                    className={`text-[10px] ${idx === currentEpIndex && isPlaying
                                                            ? "text-white/70"
                                                            : "text-neutral-500"
                                                        }`}
                                                >
                                                    {ch.isLocked ? "🔒 Terkunci" : "Gratis"}
                                                </p>
                                            </div>

                                            {/* Play indicator */}
                                            {idx === currentEpIndex && isPlaying ? (
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3].map((i) => (
                                                        <m.div
                                                            key={i}
                                                            animate={{ scaleY: [0.4, 1, 0.4] }}
                                                            transition={{
                                                                duration: 0.8,
                                                                repeat: Infinity,
                                                                delay: i * 0.15,
                                                            }}
                                                            className="h-3 w-0.5 rounded-full bg-white"
                                                        />
                                                    ))}
                                                </div>
                                            ) : !ch.isLocked ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-40">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-30">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </m.div>
                </div>
            </m.div>
        </LazyMotion>
    );
}

/* ── Page ── */
export default function ReelShortWatchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                </div>
            }
        >
            <WatchContent />
        </Suspense>
    );
}
