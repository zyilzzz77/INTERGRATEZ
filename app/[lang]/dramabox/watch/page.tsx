"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Hls from "hls.js";
import { showToast } from "@/components/Toast";
import { loadHistory, saveHistory } from "@/lib/watchHistory";

// Route HLS streams through proxy to avoid CORS/user-agent issues
const hlsProxyUrl = (url: string) => url ? `/api/hls-proxy?url=${encodeURIComponent(url)}` : "";

interface Episode {
    chapterId: string;
    chapterIndex: number;
    chapterName: string;
    videoUrl: string;
}

interface DramaDetail {
    title: string;
    cover: string;
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <m.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-28 w-28 rounded-full bg-white"
                />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden">
                    <Image src="/logo-dramabox.png" alt="DramaBox Logo" width={80} height={80} className="h-full w-full object-cover" />
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
    );
}

function WatchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookId = searchParams.get("id");
    const epParam = searchParams.get("ep"); // episode index (0-based)

    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpIndex, setCurrentEpIndex] = useState<number>(epParam ? parseInt(epParam) : 0);
    const [loading, setLoading] = useState(true);
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    const [tokenRetry, setTokenRetry] = useState(0);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [detail, setDetail] = useState<DramaDetail | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const isFetchingRef = useRef<boolean>(false);

    // Suppress unhandled media errors
    useEffect(() => {
        const handler = (event: PromiseRejectionEvent) => {
            const name = event.reason?.name;
            if (name === 'NotAllowedError' || name === 'AbortError') event.preventDefault();
        };
        window.addEventListener('unhandledrejection', handler);
        return () => window.removeEventListener('unhandledrejection', handler);
    }, []);

    // Fetch episodes
    const fetchEpisodes = useCallback(async () => {
        if (!bookId) return;
        try {
            const res = await fetch(`/api/dramabox/episodes?bookId=${bookId}`);
            const json = await res.json();
            if (json.status && Array.isArray(json.data)) {
                setEpisodes(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch episodes:", error);
        }
    }, [bookId]);

    useEffect(() => {
        if (!bookId) return;
        setLoading(true);
        showToast("Memuat episode...", "info");
        fetchEpisodes().then(() => {
            showToast("Episode berhasil dimuat", "success");
        }).catch(() => {
            showToast("Gagal memuat episode", "error");
        }).finally(() => setLoading(false));

        // Refresh episodes every 15 min to keep video tokens fresh
        const interval = setInterval(fetchEpisodes, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [bookId, fetchEpisodes]);

    // Fetch drama detail for background/metadata
    useEffect(() => {
        if (!bookId) return;
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`/api/dramabox/detail?bookId=${bookId}`);
                const json = await res.json();
                if (!mounted) return;
                if (json.status && json.data) setDetail(json.data);
            } catch (error) {
                console.error("Failed to fetch dramabox detail:", error);
            }
        })();
        return () => { mounted = false; };
    }, [bookId]);

    // Load watch history on mount (only if no explicit ep param)
    useEffect(() => {
        if (epParam || !bookId) { setHistoryLoaded(true); return; }
        loadHistory("dramabox", bookId).then((saved) => {
            if (saved !== null) setCurrentEpIndex(saved);
        }).finally(() => setHistoryLoaded(true));
    }, [bookId, epParam]);

    // Save watch history when episode changes
    useEffect(() => {
        if (!historyLoaded || !bookId) return;
        saveHistory("dramabox", bookId, currentEpIndex);
    }, [currentEpIndex, bookId, historyLoaded]);

    // Play video when episode changes with HLS support
    const currentEp = episodes[currentEpIndex];

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentEp) return;

        const rawUrl = currentEp.videoUrl || "";
        const isHls = rawUrl.includes("m3u8");
        const proxiedUrl = isHls ? hlsProxyUrl(rawUrl) : rawUrl;

        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement;

        // Cleanup previous instance and reset video element
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        video.pause();
        video.removeAttribute('src');
        video.load();

        const startPlayback = () => {
            const playPromise = video.play();
            if (playPromise) playPromise.catch(() => { /* autoplay may be blocked */ });

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
                    console.error('HLS fatal error:', data);
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else {
                        hls.destroy();
                    }
                }
            });
        } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = proxiedUrl;
            video.addEventListener('loadedmetadata', startPlayback, { once: true });
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
    }, [currentEp, tokenRetry]);

    // Auto-refresh on video error (token expired)
    const handleVideoError = async () => {
        if (tokenRetry >= 1 || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsRefreshingToken(true);
        showToast("Memperbarui sesi video...", "info");
        console.warn(`Token expired, refreshing... (${tokenRetry + 1}/1)`);
        await fetchEpisodes();
        setTokenRetry(prev => prev + 1);
        setIsRefreshingToken(false);
        isFetchingRef.current = false;
        showToast("Sesi video diperbarui", "success");
    };

    // Auto-play next episode
    const handleEnded = async () => {
        if (currentEpIndex < episodes.length - 1) {
            try {
                const res = await fetch('/api/user/deduct-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'streaming' }) });
                const resData = await res.json();
                if (!resData.success) {
                    alert(resData.error || "Kredit tidak mencukupi untuk episode selanjutnya.");
                    window.location.href = '/topup';
                    return;
                }
                setCurrentEpIndex(prev => prev + 1);
                setTokenRetry(0);
            } catch (e) {
                console.error("Failed auto play deduct", e);
            }
        }
    };

    // Change episode manually
    const selectEpisode = async (index: number) => {
        if (index === currentEpIndex) return;
        try {
            const res = await fetch('/api/user/deduct-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'streaming' }) });
            const resData = await res.json();
            if (!resData.success) {
                alert(resData.error || "Kredit tidak mencukupi untuk memutar episode ini.");
                router.push('/topup');
                return;
            }
            setCurrentEpIndex(index);
            setTokenRetry(0);
        } catch (e) {
            console.error("Failed deduct action", e);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            {loading ? (
                <LoadingState />
            ) : episodes.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Gagal memuat episode</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href={`/dramabox/detail?id=${bookId}`} className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-500">Kembali</Link>
                </div>
            ) : (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mx-auto max-w-7xl px-4 py-6 sm:py-10"
                >
                    {detail?.cover && (
                        <div className="absolute inset-0 -z-10">
                            <img src={detail.cover} alt="" className="h-full w-full object-cover blur-3xl opacity-40 scale-110" crossOrigin="anonymous" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
                        </div>
                    )}

                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-neutral-400">
                        <Link href="/dramabox" className="hover:text-red-400 transition-colors">DramaBox</Link>
                        <span>/</span>
                        <Link href={`/dramabox/detail?id=${bookId}`} className="hover:text-red-400 transition-colors">Detail</Link>
                        <span>/</span>
                        <span className="text-white">{currentEp?.chapterName || `Episode ${currentEpIndex + 1}`}</span>
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Left: Video Player */}
                        <div className="w-full lg:w-[70%]">
                            <div
                                ref={playerContainerRef}
                                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/80 shadow-2xl ring-1 ring-white/10"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {detail?.cover && (
                                    <div className="absolute inset-0 -z-10">
                                        <img src={detail.cover} alt="" className="h-full w-full object-cover blur-3xl opacity-50 scale-110" crossOrigin="anonymous" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />
                                    </div>
                                )}
                                {currentEp ? (
                                    <div className="relative h-full w-full bg-black/60 flex items-center justify-center">
                                        <video
                                            ref={videoRef}
                                            className="h-full w-full max-h-[80vh] object-contain"
                                            controls autoPlay playsInline
                                            controlsList="nodownload"
                                            onEnded={handleEnded}
                                            onError={handleVideoError}
                                        >
                                            Browser Anda tidak mendukung tag video.
                                        </video>

                                        {isRefreshingToken && (
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                                                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
                                                <p className="text-sm font-medium animate-pulse">Memperbarui sesi video...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-neutral-500">
                                        Pilih episode untuk menonton
                                    </div>
                                )}
                            </div>

                            {/* Episode Info */}
                            <div className="mt-5">
                                <h2 className="text-xl font-bold text-white sm:text-2xl">
                                    {currentEp?.chapterName || `Episode ${currentEpIndex + 1}`}
                                </h2>
                                <div className="mt-2 flex items-center gap-3 text-sm text-neutral-400">
                                    <Link
                                        href={`/dramabox/detail?id=${bookId}`}
                                        className="text-red-400 hover:text-red-300 transition-colors font-medium"
                                    >
                                        ← Lihat Detail Drama
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right: Episode List */}
                        <m.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full lg:w-[35%]"
                        >
                            <div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-2xl border-[3px] border-black bg-[#a0d1d6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                <div className="flex-none border-b-[3px] border-black px-4 py-3 bg-[#a0d1d6]">
                                    <h3 className="text-lg font-black text-black tracking-wide uppercase">Episodes</h3>
                                    <p className="text-[12px] font-bold text-black/80">TOTAL {episodes.length} EPISODE</p>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto p-4 overscroll-contain"
                                    onWheel={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
                                        {episodes.map((ep) => {
                                            const isActive = ep.chapterIndex === currentEpIndex;
                                            return (
                                                <button
                                                    key={ep.chapterId}
                                                    id={`ep-${ep.chapterIndex}`}
                                                    onClick={() => selectEpisode(ep.chapterIndex)}
                                                    className={`relative flex aspect-square items-center justify-center rounded-xl border-[2.5px] text-sm font-black transition-all ${isActive
                                                        ? "bg-yellow-400 text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-1"
                                                        : "bg-white text-black border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0_0_0_0_rgba(0,0,0,1)]"
                                                        }`}
                                                >
                                                    {isActive && (
                                                        <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-black">
                                                            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                                                        </div>
                                                    )}
                                                    {ep.chapterIndex + 1}
                                                </button>
                                            );
                                        })}
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

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
