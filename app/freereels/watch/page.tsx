"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Hls from "hls.js";
import { LazyMotion, domAnimation, m } from "framer-motion";

/* ── Types ── */
interface SubtitleItem {
    language: string;
    type: string;
    subtitle: string;
    vtt?: string;
    display_name: string;
}

interface EpisodeItem {
    id: string;
    name: string;
    cover: string;
    external_audio_h264_m3u8: string;
    external_audio_h265_m3u8: string;
    subtitle_list?: SubtitleItem[];
    original_audio_language: string;
    index: number;
    unlock: boolean;
    duration: number;
    video_type: string;
    trans_resolution: string;
}

interface DramaInfo {
    id: string;
    name: string;
    desc: string;
    tag: string[] | null;
    content_tags: string[] | null;
    cover: string;
    episode_count: number;
    follow_count: number;
    comment_count: number;
    finish_status: number;
    episode_list: EpisodeItem[];
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

        // Proxy the m3u8 URL through our backend
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
            // Safari natively supports HLS
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
                        className="absolute h-28 w-28 rounded-full bg-white"
                    />
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
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
                        className="h-full w-full rounded-full bg-white"
                    />
                </div>
            </div>
        </LazyMotion>
    );
}

/* ── Watch Content ── */
function WatchContent() {
    const searchParams = useSearchParams();
    const seriesKey = searchParams.get("key");

    const [dramaInfo, setDramaInfo] = useState<DramaInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentEpIndex, setCurrentEpIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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
        if (!seriesKey) return;

        async function fetchData() {
            try {
                const res = await fetch(`/api/freereels/detail?id=${encodeURIComponent(seriesKey!)}`);
                const json = await res.json();
                if (json.code === 200 && json.data?.info) {
                    setDramaInfo(json.data.info);
                }
            } catch (error) {
                console.error("Failed to fetch FreeReels detail:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [seriesKey]);

    const currentEpisode = dramaInfo?.episode_list?.[currentEpIndex] || null;

    const handleEpisodeSelect = useCallback((index: number) => {
        setCurrentEpIndex(index);
        setIsPlaying(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleNextEpisode = useCallback(() => {
        if (!dramaInfo) return;
        const nextIdx = currentEpIndex + 1;
        if (nextIdx < dramaInfo.episode_list.length) {
            handleEpisodeSelect(nextIdx);
        }
    }, [currentEpIndex, dramaInfo, handleEpisodeSelect]);

    const handlePrevEpisode = useCallback(() => {
        if (currentEpIndex > 0) {
            handleEpisodeSelect(currentEpIndex - 1);
        }
    }, [currentEpIndex, handleEpisodeSelect]);

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) return <LoadingState />;

    if (!dramaInfo) {
        return (
            <LazyMotion features={domAnimation}>
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Drama tidak ditemukan</h2>
                    <p className="text-neutral-400 mt-2">Silakan coba lagi nanti</p>
                    <Link
                        href="/freereels"
                        className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-all hover:bg-neutral-200"
                    >
                        Kembali
                    </Link>
                </div>
            </LazyMotion>
        );
    }

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
                    <Link href="/freereels" className="hover:text-white transition-colors">
                        FreeReels
                    </Link>
                    <span>/</span>
                    <span className="truncate text-neutral-300">{dramaInfo.name}</span>
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
                            {isPlaying && currentEpisode ? (
                                <HlsPlayer
                                    src={currentEpisode.external_audio_h264_m3u8}
                                    poster={currentEpisode.cover}
                                    onEnded={handleNextEpisode}
                                />
                            ) : (
                                <div className="relative h-full w-full">
                                    <img
                                        src={dramaInfo.cover}
                                        alt={dramaInfo.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                        {currentEpisode ? (
                                            <button
                                                onClick={() => setIsPlaying(true)}
                                                className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl transition-all hover:scale-110 active:scale-95"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" className="h-8 w-8 ml-1">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
                                                Episode belum tersedia
                                            </div>
                                        )}
                                        {currentEpisode && (
                                            <p className="mt-4 text-sm font-medium text-white/80">
                                                Episode {currentEpisode.index} • {formatDuration(currentEpisode.duration)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Episode Navigation */}
                        {isPlaying && currentEpisode && (
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.08]">
                                <button
                                    onClick={handlePrevEpisode}
                                    disabled={currentEpIndex === 0}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ← Sebelumnya
                                </button>
                                <span className="text-sm font-bold text-white">
                                    Episode {currentEpisode.index} / {dramaInfo.episode_list.length}
                                </span>
                                <button
                                    onClick={handleNextEpisode}
                                    disabled={currentEpIndex >= dramaInfo.episode_list.length - 1}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Berikutnya →
                                </button>
                            </div>
                        )}

                        {/* Drama Info (below player on mobile, sidebar on desktop) */}
                        <div className="mt-6 space-y-5 lg:hidden">
                            <div>
                                <h1 className="text-2xl font-black text-white leading-tight">
                                    {dramaInfo.name}
                                </h1>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-400">
                                    <span>📑 {dramaInfo.episode_count} Episode</span>
                                    {dramaInfo.follow_count > 0 && <span>♥ {dramaInfo.follow_count.toLocaleString()}</span>}
                                    {dramaInfo.finish_status === 2 && (
                                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Tamat</span>
                                    )}
                                </div>
                            </div>
                            {dramaInfo.content_tags && dramaInfo.content_tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {dramaInfo.content_tags.map((tag, i) => (
                                        <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">{tag}</span>
                                    ))}
                                </div>
                            )}
                            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
                                <h3 className="mb-2 text-sm font-bold text-white">Sinopsis</h3>
                                <p className="text-sm leading-relaxed text-neutral-400">{dramaInfo.desc}</p>
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
                                    {dramaInfo.name}
                                </h1>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-400">
                                    <span>📑 {dramaInfo.episode_count} Episode</span>
                                    {dramaInfo.follow_count > 0 && <span>♥ {dramaInfo.follow_count.toLocaleString()}</span>}
                                    {dramaInfo.comment_count > 0 && <span>💬 {dramaInfo.comment_count.toLocaleString()}</span>}
                                    {dramaInfo.finish_status === 2 && (
                                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">Tamat</span>
                                    )}
                                </div>
                            </div>

                            {/* Tags (desktop only) */}
                            {dramaInfo.content_tags && dramaInfo.content_tags.length > 0 && (
                                <div className="hidden lg:flex flex-wrap gap-1.5">
                                    {dramaInfo.content_tags.map((tag, i) => (
                                        <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Synopsis (desktop only) */}
                            <div className="hidden lg:block rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
                                <h3 className="mb-2 text-sm font-bold text-white">Sinopsis</h3>
                                <p className="text-sm leading-relaxed text-neutral-400">{dramaInfo.desc}</p>
                            </div>

                            {/* Episode List */}
                            <div className="flex flex-col rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] overflow-hidden isolate">
                                <div className="flex-none border-b border-white/[0.06] p-4 bg-neutral-900/80 backdrop-blur-md z-10">
                                    <h3 className="text-sm font-bold text-white">
                                        Daftar Episode ({dramaInfo.episode_list.length})
                                    </h3>
                                </div>
                                <div
                                    className="overflow-y-auto overscroll-contain p-2 space-y-1"
                                    style={{ maxHeight: "45vh" }}
                                    onWheel={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    {dramaInfo.episode_list.map((ep, idx) => (
                                        <button
                                            key={ep.id}
                                            onClick={() => handleEpisodeSelect(idx)}
                                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${idx === currentEpIndex && isPlaying
                                                    ? "bg-white text-black shadow-lg"
                                                    : "hover:bg-white/[0.05] text-neutral-400"
                                                }`}
                                        >
                                            {/* Episode number */}
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${idx === currentEpIndex && isPlaying
                                                        ? "bg-black text-white"
                                                        : "bg-white/[0.06] text-neutral-500"
                                                    }`}
                                            >
                                                {ep.index}
                                            </div>

                                            {/* Episode info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${idx === currentEpIndex && isPlaying ? "text-black" : "text-neutral-300"
                                                    }`}>
                                                    Episode {ep.index}
                                                </p>
                                                <p className={`text-[10px] ${idx === currentEpIndex && isPlaying ? "text-black/60" : "text-neutral-500"
                                                    }`}>
                                                    {formatDuration(ep.duration)}
                                                    {ep.video_type === "free" && " • Gratis"}
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
                                                            className="h-3 w-0.5 rounded-full bg-black"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-40">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subtitle languages for current episode */}
                            {currentEpisode?.subtitle_list && currentEpisode.subtitle_list.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-bold text-white">
                                        Subtitle ({currentEpisode.subtitle_list.length} bahasa)
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {currentEpisode.subtitle_list.map((sub, i) => (
                                            <span
                                                key={i}
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] ${sub.type === "original"
                                                        ? "bg-white text-black font-bold"
                                                        : "border border-white/10 bg-white/[0.03] text-neutral-500"
                                                    }`}
                                            >
                                                {sub.display_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </m.div>
                </div>
            </m.div>
        </LazyMotion>
    );
}

/* ── Page ── */
export default function FreeReelsWatchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                </div>
            }
        >
            <WatchContent />
        </Suspense>
    );
}
