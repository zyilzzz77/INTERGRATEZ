"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Hls from "hls.js";
import { showToast } from "@/components/Toast";
import { loadHistory, saveHistory } from "@/lib/watchHistory";

const hlsProxyUrl = (url: string) => url ? `/api/hls-proxy?url=${encodeURIComponent(url)}` : "";

interface FlickReelsEpisode {
    chapter_id: string;
    chapter_num: number;
    chapter_title: string;
    play_url: string;
    duration: number;
}

interface FlickReelsDetail {
    playlet_id: string;
    playlet_title: string;
    cover: string;
    list: FlickReelsEpisode[];
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <m.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-28 w-28 rounded-full bg-yellow-500/20"
                />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl shadow-yellow-500/20 text-4xl">
                    🎬
                </div>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                />
            </div>
        </div>
    );
}

function DramaImage({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [imgSrc, setImgSrc] = useState(src);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => {
        if (retryCount < 2) {
            setTimeout(() => {
                setRetryCount((c) => c + 1);
                setImgSrc(`${src}${src.includes("?") ? "&" : "?"}retry=${retryCount + 1}`);
            }, 2000);
        } else { setError(true); setLoaded(true); }
    }, [retryCount, src]);

    return (
        <>
            {!loaded && <div className="absolute inset-0 z-10"><div className="h-full w-full animate-pulse bg-neutral-700" /></div>}
            {error ? (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                        <rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                    </svg>
                </div>
            ) : (
                <img src={imgSrc || undefined} alt={alt} className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                    crossOrigin="anonymous" onLoad={handleLoad} onError={handleError} />
            )}
        </>
    );
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function DetailContent() {
    const searchParams = useSearchParams();
    const bookId = searchParams.get("id");

    const [detail, setDetail] = useState<FlickReelsDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Player state
    const [currentEpIndex, setCurrentEpIndex] = useState<number>(-1);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [loadingVideo, setLoadingVideo] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const playerSectionRef = useRef<HTMLDivElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const lastFetchedBookId = useRef<string | null>(null);

    // We do not fetch individual video URLs for FlickReels, the play_url is already in the list
    // so we don't need a token retry logic, but we still handle playback errors defensively
    const [tokenRetry, setTokenRetry] = useState(0);

    // Suppress unhandled media errors
    useEffect(() => {
        const handler = (event: PromiseRejectionEvent) => {
            const name = event.reason?.name;
            if (name === 'NotAllowedError' || name === 'AbortError') event.preventDefault();
        };
        window.addEventListener('unhandledrejection', handler);
        return () => window.removeEventListener('unhandledrejection', handler);
    }, []);

    // Fetch detail
    useEffect(() => {
        if (!bookId) return;
        if (lastFetchedBookId.current === bookId) return;
        lastFetchedBookId.current = bookId;

        async function fetchDetail() {
            showToast("Memuat detail drama...", "info");
            try {
                const res = await fetch(`/api/flickreels/detail?id=${bookId}`);
                const json = await res.json();
                
                if (json.list) {
                    setDetail(json);
                    
                    // Try to restore last-watched episode
                    const savedEp = await loadHistory("flickreels", bookId!);
                    if (savedEp !== null && savedEp >= 0 && savedEp < json.list.length) {
                        setCurrentEpIndex(savedEp);
                        const url = json.list[savedEp]?.play_url;
                        if (url) {
                            setVideoUrl(`${url}#${Date.now()}`); // Force refresh just in case
                        }
                    }
                    setHistoryLoaded(true);
                    showToast("Detail drama berhasil dimuat", "success");
                } else {
                    showToast("Gagal memuat detail drama", "error");
                }
            } catch (error) {
                console.error("Failed to fetch detail:", error);
                showToast("Gagal memuat detail drama", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();
    }, [bookId]);

    // Save watch history when episode changes
    useEffect(() => {
        if (!historyLoaded || !bookId || currentEpIndex < 0) return;
        saveHistory("flickreels", bookId, currentEpIndex);
    }, [currentEpIndex, bookId, historyLoaded]);

    const playVideoFromUrl = (url: string) => {
        setLoadingVideo(true);
        setVideoUrl(`${url}#${Date.now()}`);
        setLoadingVideo(false);
    };

    // Play video when URL changes with HLS support
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        const rawUrl = videoUrl.replace(/#\d+$/, "");
        const isHls = rawUrl.includes("m3u8");
        const proxiedUrl = isHls ? hlsProxyUrl(rawUrl) : rawUrl;

        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        video.pause();
        video.removeAttribute('src');
        video.load();

        const startPlayback = () => {
            const playPromise = video.play();
            if (playPromise) playPromise.catch(() => { });

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

        if (isHls && Hls.isSupported()) {
            const hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = false; } });
            hlsRef.current = hls;
            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => startPlayback());
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else {
                        hls.destroy();
                    }
                }
            });
        } else {
            video.src = proxiedUrl;
            video.addEventListener('loadedmetadata', startPlayback, { once: true });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl]);

    // Handle video error
    const handleVideoError = async () => {
        const video = videoRef.current;
        const err = video?.error;
        if (err?.code === MediaError.MEDIA_ERR_ABORTED) return;
        if (!detail || currentEpIndex < 0) return;
        
        if (tokenRetry >= 1) return; // Prevent loop

        showToast("Terjadi kesalahan, mencoba ulang...", "info");
        const url = detail.list[currentEpIndex]?.play_url;
        if (url) {
            setTokenRetry(prev => prev + 1);
            playVideoFromUrl(url);
        }
    };

    // Auto-play next episode
    const handleEnded = async () => {
        if (!detail || currentEpIndex >= detail.list.length - 1) return;

        try {
            const res = await fetch('/api/user/deduct-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'streaming' }) });
            const resData = await res.json();
            if (!resData.success) {
                alert(resData.error || "Kredit tidak mencukupi untuk episode selanjutnya.");
                window.location.href = '/topup';
                return;
            }

            const nextIndex = currentEpIndex + 1;
            setCurrentEpIndex(nextIndex);
            setTokenRetry(0);
            const url = detail.list[nextIndex]?.play_url;
            if (url) playVideoFromUrl(url);
        } catch (e) {
            console.error("Failed auto play deduct", e);
        }
    };

    // Select episode
    const selectEpisode = async (index: number) => {
        if (!detail || index === currentEpIndex) return;

        if (currentEpIndex >= 0) {
            try {
                const res = await fetch('/api/user/deduct-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'streaming' }) });
                const resData = await res.json();
                if (!resData.success) {
                    alert(resData.error || "Kredit tidak mencukupi untuk memutar episode ini.");
                    window.location.href = '/topup';
                    return;
                }
            } catch (e) {
                console.error("Failed deduct action", e);
                return;
            }
        }

        setCurrentEpIndex(index);
        setTokenRetry(0);
        const url = detail.list[index]?.play_url;
        if (url) playVideoFromUrl(url);

        setTimeout(() => {
            playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const currentVideo = detail && currentEpIndex >= 0 ? detail.list[currentEpIndex] : null;

    if (!bookId) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-white">ID Drama tidak ditemukan</h2>
                <Link href="/flickreels" className="mt-4 rounded-lg bg-yellow-500 px-6 py-2 text-black font-semibold hover:bg-yellow-400">Kembali</Link>
            </div>
        );
    }

    return (
        <LazyMotion features={domAnimation}>
            {loading ? (
                <LoadingState />
            ) : !detail ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Gagal memuat data</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href="/flickreels" className="mt-4 rounded-lg bg-yellow-500 px-6 py-2 text-black font-semibold hover:bg-yellow-400">Kembali</Link>
                </div>
            ) : (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-5xl px-4 py-6 sm:py-10"
                >
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-neutral-400">
                        <Link href="/flickreels" className="hover:text-yellow-400 transition-colors">FlickReels Top</Link>
                        <span>/</span>
                        <span className="truncate text-white">{detail.playlet_title}</span>
                    </div>

                    {/* ===== HERO SECTION ===== */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                        <div className="absolute inset-0 z-0">
                            <img src={detail.cover} alt="" className="h-full w-full object-cover blur-3xl opacity-80 scale-110" crossOrigin="anonymous" />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
                            <div className="relative mx-auto w-44 flex-shrink-0 overflow-hidden rounded-xl shadow-xl ring-1 ring-white/10 sm:mx-0 sm:w-52">
                                <div className="aspect-[2/3]">
                                    <DramaImage src={detail.cover} alt={detail.playlet_title} />
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-center text-center sm:text-left">
                                <h1 className="text-2xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
                                    {detail.playlet_title}
                                </h1>

                                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                        📑 {detail.list.length} Episode
                                    </span>
                                </div>

                                {detail.list.length > 0 && currentEpIndex < 0 && (
                                    <div className="mt-6 flex justify-center sm:justify-start">
                                        <button
                                            onClick={() => selectEpisode(0)}
                                            className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-yellow-500 text-black px-8 py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0_0_0_0_rgba(0,0,0,1)] transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            Tonton Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== VIDEO PLAYER + EPISODE LIST ===== */}
                    <div ref={playerSectionRef} className="mt-6">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            {/* Left: Video Player */}
                            <div className="w-full lg:w-[65%]">
                                {currentEpIndex >= 0 && currentVideo ? (
                                    <m.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="rounded-2xl border-2 border-white/10 bg-neutral-900 overflow-hidden shadow-2xl">
                                            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black">
                                                <div className="min-w-0">
                                                    <h2 className="text-sm font-bold text-white truncate">
                                                        Episode {currentVideo.chapter_num}
                                                    </h2>
                                                    <p className="text-[11px] text-neutral-400 truncate">{detail.playlet_title}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0 ml-3">
                                                    {currentEpIndex > 0 && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEpIndex - 1)}
                                                            className="rounded bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/20 transition-colors"
                                                        >
                                                            ← Prev
                                                        </button>
                                                    )}
                                                    {currentEpIndex < detail.list.length - 1 && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEpIndex + 1)}
                                                            className="rounded bg-yellow-500 px-3 py-1.5 font-bold text-black hover:bg-yellow-400 transition-colors"
                                                        >
                                                            Next →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                ref={playerContainerRef}
                                                className="relative aspect-video w-full bg-black"
                                                onContextMenu={(e) => e.preventDefault()}
                                            >
                                                <video
                                                    ref={videoRef}
                                                    className="h-full w-full object-contain"
                                                    controls autoPlay playsInline
                                                    controlsList="nodownload"
                                                    onEnded={handleEnded}
                                                    onError={handleVideoError}
                                                >
                                                    Browser Anda tidak mendukung tag video.
                                                </video>

                                                {loadingVideo && (
                                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                                                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-yellow-500" />
                                                        <p className="text-sm font-bold tracking-wide animate-pulse text-yellow-500">Memuat video...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </m.div>
                                ) : (
                                    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-white/5 bg-white/5 p-8 text-center text-neutral-400">
                                        Pilih episode di samping untuk mulai menonton
                                    </div>
                                )}
                            </div>

                            {/* Right: Episode List */}
                            <div className="w-full lg:w-[35%]">
                                <div className="lg:sticky lg:top-24 flex flex-col rounded-2xl border-[3px] border-black bg-[#a0d1d6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all" style={{ maxHeight: 'calc(56.25vw * 0.65 + 44px)', minHeight: '300px' }}>
                                    <div className="flex-none border-b-[3px] border-black px-4 py-3 bg-[#a0d1d6]">
                                        <h3 className="text-lg font-black text-black tracking-wide uppercase">Episodes</h3>
                                        <p className="text-[12px] font-bold text-black/80">TOTAL {detail.list.length} EPISODE</p>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 overscroll-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black hover:scrollbar-thumb-black/80" onWheel={(e) => e.stopPropagation()}>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
                                            {detail.list.map((ep, index) => {
                                                const isPlaying = index === currentEpIndex;
                                                return (
                                                    <button
                                                        key={ep.chapter_id}
                                                        onClick={() => selectEpisode(index)}
                                                        className={`relative flex aspect-square items-center justify-center rounded-xl border-[2.5px] text-sm font-black transition-all ${
                                                            isPlaying
                                                                ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-1"
                                                                : "bg-white text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0_0_0_0_rgba(0,0,0,1)]"
                                                        }`}
                                                    >
                                                        {isPlaying && (
                                                            <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-black">
                                                                <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                                                            </div>
                                                        )}
                                                        {ep.chapter_num}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </m.div>
            )}
        </LazyMotion>
    );
}

export default function FlickReelsDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
            </div>
        }>
            <DetailContent />
        </Suspense>
    );
}

