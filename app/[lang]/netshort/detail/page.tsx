"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { showToast } from "@/components/Toast";
import { loadHistory, saveHistory } from "@/lib/watchHistory";

interface NetshortDetail {
    id: string;
    libraryId: string;
    title: string;
    cover: string;
    synopsis: string;
    totalEpisode: number;
    tags: string[];
    isFinish: boolean;
    isNew: boolean;
    scriptName: string;
}

interface WatchData {
    videoUrl: string;
    subtitles: { lang: string; url: string }[];
    currentEp: number;
    maxEps: number;
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
                <m.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute h-28 w-28 rounded-full bg-cyan-500/20"
                />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 shadow-xl shadow-cyan-500/20 text-4xl">
                    🎬
                </div>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
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
                    referrerPolicy="no-referrer" onLoad={handleLoad} onError={handleError} />
            )}
        </>
    );
}

function DetailContent() {
    const searchParams = useSearchParams();
    const dramaId = searchParams.get("id");

    const [detail, setDetail] = useState<NetshortDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFullSynopsis, setShowFullSynopsis] = useState(false);

    // Player state
    const [currentEp, setCurrentEp] = useState<number>(-1); // -1 = not playing
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [subtitleUrl, setSubtitleUrl] = useState<string>("");
    const [loadingVideo, setLoadingVideo] = useState(false);
    const [isRefreshingToken, setIsRefreshingToken] = useState(false);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const playerSectionRef = useRef<HTMLDivElement | null>(null);

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
        if (!dramaId) return;

        async function fetchDetail() {
            showToast("Memuat detail drama...", "info");
            try {
                const res = await fetch(`/api/netshort/detail?id=${dramaId}`);
                const json = await res.json();
                if (json.status && json.data) {
                    setDetail(json.data);
                    setTotalEpisodes(json.data.totalEpisode);
                    // Try to restore last-watched episode
                    const savedEp = await loadHistory("netshort", dramaId!);
                    if (savedEp !== null && savedEp >= 1 && savedEp <= json.data.totalEpisode) {
                        setCurrentEp(savedEp);
                        // Fetch video for saved episode
                        const videoRes = await fetch(`/api/netshort/watch?id=${dramaId}&ep=${savedEp}`);
                        const videoJson = await videoRes.json();
                        if (videoJson.status && videoJson.data?.videoUrl) {
                            setVideoUrl(videoJson.data.videoUrl);
                            if (videoJson.data.subtitles?.length > 0) {
                                setSubtitleUrl(videoJson.data.subtitles[0].url);
                            }
                            if (videoJson.data.maxEps) {
                                setTotalEpisodes(videoJson.data.maxEps);
                            }
                        }
                    }
                    setHistoryLoaded(true);
                }
                showToast("Detail drama berhasil dimuat", "success");
            } catch (error) {
                console.error("Failed to fetch detail:", error);
                showToast("Gagal memuat detail drama", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();
    }, [dramaId]);

    // Save watch history when episode changes
    useEffect(() => {
        if (!historyLoaded || !dramaId || currentEp < 1) return;
        saveHistory("netshort", dramaId, currentEp);
    }, [currentEp, dramaId, historyLoaded]);

    // Fetch video URL for episode
    const fetchVideoUrl = async (epNumber: number) => {
        if (!dramaId) return "";
        setLoadingVideo(true);
        showToast("Memuat video...", "info");
        try {
            const res = await fetch(`/api/netshort/watch?id=${dramaId}&ep=${epNumber}`);
            const json = await res.json();
            if (json.status && json.data?.videoUrl) {
                setVideoUrl(json.data.videoUrl);
                if (json.data.subtitles?.length > 0) {
                    setSubtitleUrl(json.data.subtitles[0].url);
                } else {
                    setSubtitleUrl("");
                }
                if (json.data.maxEps) {
                    setTotalEpisodes(json.data.maxEps);
                }
                showToast("Video berhasil dimuat", "success");
                return json.data.videoUrl;
            }
        } catch (error) {
            console.error("Failed to fetch video:", error);
            showToast("Gagal memuat video", "error");
        } finally {
            setLoadingVideo(false);
        }
        return "";
    };

    // Play video when URL changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement; // Simpan elemen mana yang sedang fullscreen

        // Pause and clear out old source to prevent AbortError in Safari/iOS
        video.pause();
        video.removeAttribute('src');
        video.load();

        setTimeout(() => {
            video.src = videoUrl;
            video.load();
            const playPromise = video.play();
            if (playPromise) playPromise.catch(() => { });

            if (isFullscreen) {
                setTimeout(() => {
                    if (!document.fullscreenElement) {
                        // Coba ke video dulu jika sebelumnya yang fullscreen adalah video (atau default ke video karena native controls Mobile sering ke video)
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
    }, [videoUrl]);

    // Handle video error
    const handleVideoError = async () => {
        const video = videoRef.current;
        const err = video?.error;
        if (err?.code === MediaError.MEDIA_ERR_ABORTED) return;
        if (currentEp < 1) return;

        setIsRefreshingToken(true);
        showToast("Memperbarui sesi video...", "info");
        await fetchVideoUrl(currentEp);
        showToast("Sesi video diperbarui", "success");
        setIsRefreshingToken(false);
    };

    // Auto-play next episode
    const handleEnded = async () => {
        if (currentEp >= totalEpisodes) return;

        try {
            const res = await fetch('/api/user/deduct-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'streaming' }) });
            const resData = await res.json();
            if (!resData.success) {
                alert(resData.error || "Kredit tidak mencukupi untuk episode selanjutnya.");
                window.location.href = '/topup';
                return;
            }

            const nextEp = currentEp + 1;
            setCurrentEp(nextEp);
            await fetchVideoUrl(nextEp);
        } catch (e) {
            console.error("Failed auto play deduct", e);
        }
    };

    // Select episode
    const selectEpisode = async (epNumber: number) => {
        if (epNumber === currentEp) return;

        // First episode is free, subsequent deduct credit
        if (currentEp >= 1) {
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

        setCurrentEp(epNumber);
        await fetchVideoUrl(epNumber);

        // Scroll to player
        setTimeout(() => {
            playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    if (!dramaId) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-white">ID Drama tidak ditemukan</h2>
                <Link href="/netshort" className="mt-4 rounded-lg bg-cyan-600 px-6 py-2 text-white hover:bg-cyan-500">Kembali</Link>
            </div>
        );
    }

    // Generate episode numbers array
    const episodes = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

    return (
        <LazyMotion features={domAnimation}>
            {loading ? (
                <LoadingState />
            ) : !detail ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Gagal memuat data</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href="/netshort" className="mt-4 rounded-lg bg-cyan-600 px-6 py-2 text-white hover:bg-cyan-500">Kembali</Link>
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
                        <Link href="/netshort" className="hover:text-cyan-400 transition-colors">Netshort Drama</Link>
                        <span>/</span>
                        <span className="truncate text-white">{detail.title}</span>
                    </div>

                    {/* ===== HERO SECTION ===== */}
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                        {/* Background Blur */}
                        <div className="absolute inset-0 z-0">
                            <img src={detail.cover} alt="" className="h-full w-full object-cover blur-3xl opacity-20 scale-110" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
                            {/* Cover */}
                            <div className="relative mx-auto w-44 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:mx-0 sm:w-52">
                                <div className="aspect-[3/4]">
                                    <DramaImage src={detail.cover} alt={detail.title} />
                                </div>
                                {detail.isNew && (
                                    <div className="absolute top-3 left-3 z-20 rounded-md bg-cyan-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
                                        ✨ Baru
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
                                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                        📑 {detail.totalEpisode} Episode
                                    </span>
                                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                        {detail.isFinish ? "✅ Tamat" : "🔄 Ongoing"}
                                    </span>
                                    {detail.scriptName && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                                            📺 {detail.scriptName}
                                        </span>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {detail.tags.map((tag, idx) => (
                                        <span key={idx} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-500/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Play Button */}
                                {totalEpisodes > 0 && currentEp < 1 && (
                                    <div className="mt-6 flex justify-center sm:justify-start">
                                        <button
                                            onClick={() => selectEpisode(1)}
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
                    {detail.synopsis && (
                        <div className="mt-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                            <h2 className="mb-3 text-lg font-bold text-white">Sinopsis</h2>
                            <p className={`text-sm leading-relaxed text-neutral-300 ${!showFullSynopsis ? "line-clamp-3" : ""}`}>
                                {detail.synopsis}
                            </p>
                            {detail.synopsis.length > 150 && (
                                <button onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                                    className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                                    {showFullSynopsis ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
                                </button>
                            )}
                        </div>
                    )}

                    {/* ===== VIDEO PLAYER + EPISODE LIST ===== */}
                    <div ref={playerSectionRef} className="mt-6">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            {/* Left: Video Player */}
                            <div className="w-full lg:w-[65%]">
                                {currentEp >= 1 ? (
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
                                                        Episode {currentEp}
                                                    </h2>
                                                    <p className="text-[11px] text-neutral-400 truncate">{detail.title}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0 ml-3">
                                                    {currentEp > 1 && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEp - 1)}
                                                            className="rounded-lg bg-white/5 px-2.5 py-1 font-medium hover:bg-white/10 transition-colors"
                                                        >
                                                            ← Prev
                                                        </button>
                                                    )}
                                                    {currentEp < totalEpisodes && (
                                                        <button
                                                            onClick={() => selectEpisode(currentEp + 1)}
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
                                                    {subtitleUrl && (
                                                        <track
                                                            kind="subtitles"
                                                            src={subtitleUrl}
                                                            srcLang="id"
                                                            label="Indonesia"
                                                            default
                                                        />
                                                    )}
                                                    Browser Anda tidak mendukung tag video.
                                                </video>

                                                {(loadingVideo || isRefreshingToken) && (
                                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                                                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-cyan-500" />
                                                        <p className="text-sm font-medium animate-pulse">{loadingVideo ? "Memuat video..." : "Memperbarui sesi video..."}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </m.div>
                                ) : (
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
                                <div className="lg:sticky lg:top-24 flex flex-col rounded-2xl border-[3px] border-black bg-[#a0d1d6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden" style={{ maxHeight: 'calc(56.25vw * 0.65 + 44px)', minHeight: '300px' }}>
                                    <div className="flex-none border-b-[3px] border-black px-4 py-3 bg-[#a0d1d6]">
                                        <h3 className="text-lg font-black text-black tracking-wide uppercase">Episodes</h3>
                                        <p className="text-[12px] font-bold text-black/80">TOTAL {totalEpisodes} EPISODE</p>
                                    </div>

                                    <div
                                        className="flex-1 overflow-y-auto p-4 overscroll-contain"
                                        onWheel={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-3">
                                            {episodes.map((epNum) => {
                                                const isActive = epNum === currentEp;
                                                return (
                                                    <button
                                                        key={epNum}
                                                        onClick={() => selectEpisode(epNum)}
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
                                                        {epNum}
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

export default function NetshortDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            </div>
        }>
            <DetailContent />
        </Suspense>
    );
}
