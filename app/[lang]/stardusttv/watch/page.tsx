"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Hls from "hls.js";
import { showToast } from "@/components/Toast";
import { loadHistory, saveHistory } from "@/lib/watchHistory";

// Convert a raw stream URL to go through /api/hls-proxy
const hlsProxyUrl = (url: string) => {
    if (!url) return '';
    return `/api/hls-proxy?url=${encodeURIComponent(url)}`;
};

interface DetailData {
    id: string;
    slug: string;
    title: string;
    poster: string;
    totalEpisodes: number;
}

interface EpisodeData {
    episode: number;
    h264: string;
    h265: string;
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full rounded-full bg-cyan-500"
                />
            </div>
        </div>
    );
}

function WatchContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const titleParam = searchParams.get("title") || "StardustTV";
    const posterParam = searchParams.get("poster") || "";
    const cover = posterParam.startsWith('http')
        ? `/api/proxy-image?url=${encodeURIComponent(posterParam)}`
        : posterParam;

    const [detailData, setDetailData] = useState<DetailData | null>(null);
    const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [isFetchingSubsequent, setIsFetchingSubsequent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Suppress unhandled media errors from browser policies
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const name = event.reason?.name;
            if (name === 'NotAllowedError' || name === 'AbortError') {
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    // Fetch detail data (info only, no episodes)
    useEffect(() => {
        if (!slug || !id) return;
        async function fetchDetail() {
            showToast("Memuat detail drama...", "info");
            try {
                const res = await fetch(`/api/stardusttv/detail?slug=${encodeURIComponent(slug!)}&id=${encodeURIComponent(id!)}`);
                const json = await res.json();

                if (!res.ok || json.error) {
                    setError(json.error || "Gagal memuat data");
                    setLoading(false);
                    showToast("Gagal memuat detail drama", "error");
                    return;
                }

                if (json.success && json.data) {
                    setDetailData(json.data);
                    showToast("Detail drama berhasil dimuat", "success");
                }
            } catch (err) {
                console.error("Failed to fetch StardustTV detail:", err);
                setError("Gagal memuat data");
                setLoading(false);
                showToast("Terjadi kesalahan sistem", "error");
            }
        }
        fetchDetail();
    }, [slug, id]);

    // Fetch episode stream
    const fetchEpisode = async (epNum: number, isInitial = false) => {
        if (!slug || !id) return;

        if (isInitial) {
            setLoading(true);
        } else {
            setIsFetchingSubsequent(true);
        }

        try {
            showToast("Memuat episode...", "info");
            const res = await fetch(`/api/stardusttv/episode?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}&ep=${epNum}`);
            const json = await res.json();

            if (!res.ok || json.error) {
                if (res.status === 403 || json.error === "Kredit tidak mencukupi") {
                    showToast("Kredit tidak mencukupi", "error");
                    alert(json.error || "Kredit tidak mencukupi");
                    window.location.href = "/topup";
                }
                console.error("API error:", json.error);
                showToast("Gagal memuat streaming", "error");
                return;
            }

            if (json.success && json.data) {
                setEpisodeData(json.data);
                setCurrentEpisode(epNum);
                showToast("Episode berhasil dimuat", "success");
            }
        } catch (error) {
            console.error("Failed to fetch episode:", error);
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setLoading(false);
            setIsFetchingSubsequent(false);
        }
    };

    // Load history + first episode once detail is loaded
    useEffect(() => {
        if (!detailData || !slug || !id) return;
        loadHistory("stardusttv", id).then((saved) => {
            const startEp = saved !== null ? saved : 1;
            fetchEpisode(startEp, true);
            setHistoryLoaded(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailData]);

    // Save watch history when episode changes
    useEffect(() => {
        if (!historyLoaded || !id) return;
        saveHistory("stardusttv", id, currentEpisode);
    }, [currentEpisode, id, historyLoaded]);


    // Handle video source change with HLS.js
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !episodeData) return;

        // Use h264 by default for broader compatibility
        const streamUrl = episodeData.h264 || episodeData.h265;
        if (!streamUrl) return;

        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement;
        const proxiedUrl = hlsProxyUrl(streamUrl);

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        video.poster = detailData?.poster || cover;

        const startPlayback = () => {
            const playPromise = video.play();
            if (playPromise) {
                playPromise.catch(() => { /* Autoplay blocked */ });
            }

            // Restore fullscreen if it was active
            if (isFullscreen) {
                setTimeout(() => {
                    if (!document.fullscreenElement) {
                        if (fsElement === video) {
                            video.requestFullscreen?.().catch(() => { });
                        } else if (playerContainerRef.current) {
                            playerContainerRef.current.requestFullscreen?.().catch(() => {
                                video.requestFullscreen?.().catch(() => { });
                            });
                        } else {
                            video.requestFullscreen?.().catch(() => { });
                        }
                    }
                }, 100);
            }
        };

        if (Hls.isSupported()) {
            // Use HLS.js for non-Safari browsers
            const hls = new Hls({
                xhrSetup: (xhr) => {
                    xhr.withCredentials = false;
                },
            });
            hlsRef.current = hls;
            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                startPlayback();
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    console.error('HLS fatal error:', data);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else {
                        hls.destroy();
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            video.src = proxiedUrl;
            video.addEventListener('loadedmetadata', startPlayback, { once: true });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [episodeData, detailData, cover]);

    const handleEnded = async () => {
        const totalEps = detailData?.totalEpisodes || 0;
        if (currentEpisode < totalEps) {
            const nextEp = currentEpisode + 1;
            await fetchEpisode(nextEp);
            const nextButton = document.getElementById(`episode-${nextEp}`);
            if (nextButton) {
                nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    const title = detailData?.title || titleParam;
    const totalEpisodes = detailData?.totalEpisodes || 0;
    const episodeList = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

    return (
        <LazyMotion features={domAnimation}>
            {loading ? (
                <LoadingState />
            ) : error || !detailData ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">{error || "Gagal memuat video"}</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href="/stardusttv" className="mt-4 rounded-lg bg-cyan-600 px-6 py-2 text-white transition-hover hover:bg-cyan-500">
                        Kembali
                    </Link>
                </div>
            ) : (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mx-auto max-w-7xl px-4 py-6 sm:py-10"
                >
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-neutral-400">
                        <Link href="/stardusttv" className="hover:text-cyan-400 transition-colors">StardustTV</Link>
                        <span>/</span>
                        <span className="truncate text-white">{title}</span>
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Left Column: Player & Info */}
                        <div className="w-full lg:w-[70%]">
                            {/* Player */}
                            <div
                                ref={playerContainerRef}
                                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <div className="relative h-full w-full bg-black flex items-center justify-center">
                                    <video
                                        ref={videoRef}
                                        className="h-full w-full max-h-[80vh] object-contain"
                                        controls
                                        autoPlay
                                        playsInline
                                        crossOrigin="anonymous"
                                        controlsList="nodownload"
                                        onEnded={handleEnded}
                                    >
                                        Browser Anda tidak mendukung tag video.
                                    </video>

                                    {isFetchingSubsequent && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white transition-opacity duration-300">
                                            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-cyan-500" />
                                            <p className="text-sm font-medium animate-pulse">Memuat episode...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Current Episode Info */}
                            <m.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-6 flex flex-col sm:flex-row sm:items-start gap-4"
                            >
                                {(detailData.poster || cover) && (
                                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-800 hidden sm:block">
                                        <Image
                                            src={detailData.poster || cover}
                                            alt={title}
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
                                        {title}
                                    </h1>
                                    <h2 className="mt-2 text-lg font-medium text-cyan-400">
                                        Episode {currentEpisode}
                                    </h2>

                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-1">
                                            📑 {totalEpisodes} Total Episodes
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-2xl">
                                        Anda sedang menonton StardustTV streaming. Episode selanjutnya akan berjalan otomatis. Kredit akun Anda akan terpotong secara otomatis per episode.
                                    </p>
                                </div>
                            </m.div>
                        </div>

                        {/* Right Column: Episode List */}
                        <m.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full lg:w-[35%]"
                        >
                            <div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-2xl border-[3px] border-black bg-[#a0d1d6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                <div className="flex-none border-b-[3px] border-black px-4 py-3 bg-[#a0d1d6]">
                                    <h3 className="text-lg font-black text-black tracking-wide uppercase">Episodes</h3>
                                    <p className="text-[12px] font-bold text-black/80">TOTAL {totalEpisodes} EPISODE</p>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto p-4 overscroll-contain"
                                    onWheel={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
                                        {episodeList.map((epNum) => (
                                            <button
                                                key={epNum}
                                                id={`episode-${epNum}`}
                                                disabled={isFetchingSubsequent && currentEpisode !== epNum}
                                                onClick={() => {
                                                    if (currentEpisode === epNum) return;
                                                    fetchEpisode(epNum);
                                                }}
                                                className={`relative flex aspect-square items-center justify-center rounded-xl border-[2.5px] text-sm font-black transition-all ${currentEpisode === epNum
                                                    ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-1"
                                                    : "bg-white text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0_0_0_0_rgba(0,0,0,1)]"
                                                    }`}
                                            >
                                                {currentEpisode === epNum && (
                                                    <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-black">
                                                        <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                                                    </div>
                                                )}
                                                {epNum}
                                                {currentEpisode === epNum && (
                                                    <span className="sr-only">Sedang diputar</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    </div>
                </m.div>
            )}
        </LazyMotion>
    );
}

export default function StardustTVWatchPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
