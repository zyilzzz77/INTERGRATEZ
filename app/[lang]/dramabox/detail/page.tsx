"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { showToast } from "@/components/Toast";

interface DramaDetail {
    id: string;
    title: string;
    cover: string;
    coverOriginal: string;
    chapterCount: number;
    introduction: string;
    tags: string[];
    playCount: string;
    corner: { cornerType: number; name: string; color: string } | null;
    shelfTime: string;
}

interface Episode {
    chapterId: string;
    chapterIndex: number;
    chapterName: string;
    videoUrl: string;
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
                <img src={imgSrc} alt={alt} className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                    crossOrigin="anonymous" onLoad={handleLoad} onError={handleError} />
            )}
        </>
    );
}

function DetailContent() {
    const searchParams = useSearchParams();
    const bookId = searchParams.get("id");

    const [detail, setDetail] = useState<DramaDetail | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFullSynopsis, setShowFullSynopsis] = useState(false);

    // Player state
    const [currentEpIndex, setCurrentEpIndex] = useState<number>(-1); // -1 = not playing
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    const [tokenRetry, setTokenRetry] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const playerSectionRef = useRef<HTMLDivElement | null>(null);
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

    // Fetch detail + episodes
    const fetchEpisodes = async () => {
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
    };

    useEffect(() => {
        if (!bookId) return;

        async function fetchAll() {
            showToast("Memuat detail drama...", "info");
            try {
                const [detailRes, episodesRes] = await Promise.all([
                    fetch(`/api/dramabox/detail?bookId=${bookId}`),
                    fetch(`/api/dramabox/episodes?bookId=${bookId}`),
                ]);
                const [detailJson, episodesJson] = await Promise.all([
                    detailRes.json(),
                    episodesRes.json(),
                ]);
                if (detailJson.status && detailJson.data) setDetail(detailJson.data);
                if (episodesJson.status && Array.isArray(episodesJson.data)) setEpisodes(episodesJson.data);
                showToast("Detail drama berhasil dimuat", "success");
            } catch (error) {
                console.error("Failed to fetch detail:", error);
                showToast("Gagal memuat detail drama", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchAll();

        // Refresh episodes every 15 min to keep video tokens fresh
        const interval = setInterval(fetchEpisodes, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [bookId]);

    // Play video when episode changes
    const currentEp = currentEpIndex >= 0 ? episodes[currentEpIndex] : null;

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentEp) return;

        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement;

        video.pause();
        video.removeAttribute('src');
        video.load();

        setTimeout(() => {
            video.src = currentEp.videoUrl;
            video.load();
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
        }, 50);
    }, [currentEp, tokenRetry]);

    // Auto-refresh on video error (skip AbortError which fires when switching episodes)
    const handleVideoError = async () => {
        const video = videoRef.current;
        const err = video?.error;
        // AbortError (code 20 / MEDIA_ERR_ABORTED) is harmless — happens when switching src
        if (err?.code === MediaError.MEDIA_ERR_ABORTED) return;
        if (tokenRetry >= 2 || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsRefreshingToken(true);
        await fetchEpisodes();
        setTokenRetry(prev => prev + 1);
        setIsRefreshingToken(false);
        isFetchingRef.current = false;
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

    // Select episode (with credit deduction)
    const selectEpisode = async (index: number) => {
        if (index === currentEpIndex) return;

        // First episode is free, subsequent ones deduct credit
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

        // Scroll to player
        setTimeout(() => {
            playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    if (!bookId) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-white">ID Drama tidak ditemukan</h2>
                <Link href="/dramabox" className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-500">Kembali</Link>
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
                    <Link href="/dramabox" className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-500">Kembali</Link>
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
                        <Link href="/dramabox" className="hover:text-red-400 transition-colors">DramaBox</Link>
                        <span>/</span>
                        <span className="truncate text-white">{detail.title}</span>
                    </div>

                    {/* ===== HERO SECTION: Drama Detail ===== */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                        {/* Background Blur */}
                        <div className="absolute inset-0 z-0">
                            <img src={detail.cover} alt="" className="h-full w-full object-cover blur-3xl opacity-20 scale-110" crossOrigin="anonymous" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
                            {/* Cover */}
                            <div className="relative mx-auto w-44 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:mx-0 sm:w-52">
                                <div className="aspect-[2/3]">
                                    <DramaImage src={detail.cover} alt={detail.title} />
                                </div>
                                {detail.corner && (
                                    <div className="absolute top-3 left-3 z-20 rounded-md px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm"
                                        style={{ backgroundColor: detail.corner.color || "#F54E96" }}>
                                        {detail.corner.name}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-1 flex-col justify-center text-center sm:text-left">
                                <h1 className="text-2xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
                                    {detail.title}
                                </h1>

                                {/* Stats */}
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                                    {detail.playCount && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                            🔥 {detail.playCount} Ditonton
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                        📑 {detail.chapterCount} Episode
                                    </span>
                                    {detail.shelfTime && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                            📅 {detail.shelfTime.split(" ")[0]}
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {detail.tags.map((tag, idx) => (
                                        <span key={idx} className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 border border-red-500/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Play Button */}
                                {episodes.length > 0 && currentEpIndex < 0 && (
                                    <div className="mt-6 flex justify-center sm:justify-start">
                                        <button
                                            onClick={() => selectEpisode(0)}
                                            className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3 text-sm font-bold shadow-lg shadow-black/20 dark:shadow-white/20 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
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

                    {/* Synopsis */}
                    <div className="mt-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                        <h2 className="mb-3 text-lg font-bold text-white">Sinopsis</h2>
                        <p className={`text-sm leading-relaxed text-neutral-300 ${!showFullSynopsis ? "line-clamp-3" : ""}`}>
                            {detail.introduction}
                        </p>
                        {detail.introduction.length > 150 && (
                            <button onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                                className="mt-2 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                                {showFullSynopsis ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
                            </button>
                        )}
                    </div>

                    {/* ===== VIDEO PLAYER + EPISODE LIST (Side by Side) ===== */}
                    <div ref={playerSectionRef} className="mt-6">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            {/* Left: Video Player */}
                            <div className="w-full lg:w-[65%]">
                                {currentEpIndex >= 0 && currentEp ? (
                                    <m.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                                            {/* Player Header */}
                                            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-neutral-900/50">
                                                <div className="min-w-0">
                                                    <h2 className="text-sm font-bold text-white truncate">
                                                        {currentEp.chapterName}
                                                    </h2>
                                                    <p className="text-[11px] text-neutral-400 truncate">{detail.title}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0 ml-3">
                                                    {currentEpIndex > 0 && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEpIndex - 1)}
                                                            className="rounded-lg bg-white/5 px-2.5 py-1 font-medium hover:bg-white/10 transition-colors"
                                                        >
                                                            ← Prev
                                                        </button>
                                                    )}
                                                    {currentEpIndex < episodes.length - 1 && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEpIndex + 1)}
                                                            className="rounded-lg bg-white/5 px-2.5 py-1 font-medium hover:bg-white/10 transition-colors"
                                                        >
                                                            Next →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Video */}
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

                                                {isRefreshingToken && (
                                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                                                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
                                                        <p className="text-sm font-medium animate-pulse">Memperbarui sesi video...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </m.div>
                                ) : (
                                    /* Placeholder when no episode selected */
                                    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                                        <div className="text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-12 w-12 text-neutral-600 mb-3">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <p className="text-sm text-neutral-500">Pilih episode untuk mulai menonton</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Episode List */}
                            <div className="w-full lg:w-[35%]">
                                <div className="lg:sticky lg:top-24 flex flex-col rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden" style={{ maxHeight: 'calc(56.25vw * 0.65 + 44px)', minHeight: '300px' }}>
                                    <div className="flex-none border-b border-white/10 px-4 py-3 bg-neutral-900/50 backdrop-blur-md">
                                        <h3 className="text-base font-bold text-white">Daftar Episode</h3>
                                        <p className="text-[11px] text-neutral-400">Total {episodes.length} episode</p>
                                    </div>

                                    <div
                                        className="flex-1 overflow-y-auto p-3 overscroll-contain"
                                        onWheel={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-1.5">
                                            {episodes.map((ep) => {
                                                const isActive = ep.chapterIndex === currentEpIndex;
                                                return (
                                                    <button
                                                        key={ep.chapterId}
                                                        onClick={() => selectEpisode(ep.chapterIndex)}
                                                        className={`flex items-center justify-center rounded-lg py-2 text-xs font-semibold transition-all active:scale-95 ${isActive
                                                            ? "bg-red-600 text-white ring-2 ring-red-400/50 shadow-lg shadow-red-500/20"
                                                            : "bg-white/5 text-white/80 ring-1 ring-white/5 hover:bg-red-600/20 hover:text-red-400 hover:ring-red-500/30"
                                                            }`}
                                                    >
                                                        {ep.chapterIndex + 1}
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

export default function DetailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
        }>
            <DetailContent />
        </Suspense>
    );
}
