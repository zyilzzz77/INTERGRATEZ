"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { showToast } from "@/components/Toast";
import { loadHistory, saveHistory } from "@/lib/watchHistory";

// Helper to clean URL from backticks and spaces
const cleanUrl = (url: string) => url ? url.replace(/[`\s]/g, '') : '';

// Helper to obfuscate URL
const obfuscateUrl = (url: string) => {
    if (!url) return '';
    const cleaned = cleanUrl(url);
    try {
        return `/api/stream?url=${encodeURIComponent(btoa(cleaned))}`;
    } catch {
        return cleaned;
    }
};

interface Subtitle {
    display_name: string;
    language: string;
    subtitle: string;
    vtt: string;
}

interface EpisodeData {
    chapter_num: number;
    hls_url: string;
    subtitle_list: Subtitle[];
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            {/* Main Circle */}
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="h-full w-full rounded-full bg-purple-500"
                />
            </div>
        </div>
    );
}

function WatchContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const title = searchParams.get("title") || "DramaWave";
    const coverRaw = searchParams.get("cover") || "";
    // Reconstruct the proxy URL if it was passed via query params
    const cover = coverRaw.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(coverRaw)}` : coverRaw;

    const chaptersParam = searchParams.get("chapters");
    const chapters = chaptersParam ? parseInt(chaptersParam, 10) : 0;

    const [currentChapterNum, setCurrentChapterNum] = useState<number>(1);
    const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFetchingSubsequent, setIsFetchingSubsequent] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);
    const [currentSubtitle, setCurrentSubtitle] = useState<string>("");

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

    // Fetch chapter data
    const fetchChapter = async (chapterNum: number, isInitial = false) => {
        if (!id) return;

        if (isInitial) {
            setLoading(true);
        } else {
            setIsFetchingSubsequent(true);
        }

        try {
            showToast("Memuat streaming drama...", "info");
            const res = await fetch(`/api/dramawave/episode?id=${id}&chapter=${chapterNum}`);
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

            if (json.status && json.data) {
                setEpisodeData(json.data);
                setCurrentChapterNum(chapterNum);
                showToast("Streaming berhasil dimuat", "success");
            }
        } catch (error) {
            console.error("Failed to fetch episode details:", error);
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setLoading(false);
            setIsFetchingSubsequent(false);
        }
    };

    // Load history + initial chapter
    useEffect(() => {
        if (!id) return;
        loadHistory("dramawave", id).then((saved) => {
            const startChapter = saved !== null ? saved : 1;
            fetchChapter(startChapter, true);
            setHistoryLoaded(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Save watch history when chapter changes
    useEffect(() => {
        if (!historyLoaded || !id) return;
        saveHistory("dramawave", id, currentChapterNum);
    }, [currentChapterNum, id, historyLoaded]);


    // Handle video seamless transition
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !episodeData) return;

        const url = cleanUrl(episodeData.hls_url);
        if (!url) return;

        // Check if we are currently in fullscreen
        const isFullscreen = !!document.fullscreenElement;
        const fsElement = document.fullscreenElement;

        // Temporarily clear src logic done below inside setTimeout
        video.poster = cover;
        setTimeout(() => {
            video.src = obfuscateUrl(url);
        }, 50);

        // Remove existing tracks properly
        const existingTracks = video.querySelectorAll('track');
        existingTracks.forEach(t => t.remove());

        // Add subtitle tracks (hidden — we render them ourselves)
        if (episodeData.subtitle_list && episodeData.subtitle_list.length > 0) {
            episodeData.subtitle_list.forEach(sub => {
                if (sub.vtt) {
                    const track = document.createElement("track");
                    track.kind = "captions";
                    track.label = sub.display_name;
                    track.srclang = sub.language.split("-")[0];
                    track.src = sub.vtt;

                    if (sub.language === "id-ID") {
                        track.default = true;
                    }

                    video.appendChild(track);
                }
            });

            // Hide all native tracks and attach cuechange listener for custom rendering
            setTimeout(() => {
                let activeTrack: TextTrack | null = null;
                for (let i = 0; i < video.textTracks.length; i++) {
                    const t = video.textTracks[i];
                    if (t.language.startsWith("id")) {
                        t.mode = "hidden"; // hidden = still fires cuechange, but browser doesn't render
                        activeTrack = t;
                    } else {
                        t.mode = "disabled";
                    }
                }
                // Fallback: if no Indonesian track, use the first one
                if (!activeTrack && video.textTracks.length > 0) {
                    video.textTracks[0].mode = "hidden";
                    activeTrack = video.textTracks[0];
                }

                if (activeTrack) {
                    activeTrack.oncuechange = () => {
                        const cues = activeTrack!.activeCues;
                        if (cues && cues.length > 0) {
                            const texts: string[] = [];
                            for (let j = 0; j < cues.length; j++) {
                                const cue = cues[j] as VTTCue;
                                texts.push(cue.text);
                            }
                            setCurrentSubtitle(texts.join("\n"));
                        } else {
                            setCurrentSubtitle("");
                        }
                    };
                }
            }, 500);
        }

        video.pause();
        video.removeAttribute('src');
        video.load();

        setTimeout(() => {
            video.load();

            const playPromise = video.play();
            if (playPromise) {
                playPromise.catch(() => {
                    // Autoplay blocked
                });
            }

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
    }, [episodeData, cover]);

    const handleEnded = async () => {
        if (currentChapterNum < chapters) {
            const nextChapter = currentChapterNum + 1;

            // Deduct credit explicitly before switching automatically (API also handles it, but good to check UI side if we implement pre-checks in future)
            await fetchChapter(nextChapter);

            const nextButton = document.getElementById(`chapter-${nextChapter}`);
            if (nextButton) {
                nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    // Generate episode list array
    const episodeList = Array.from({ length: chapters }, (_, i) => i + 1);

    return (
        <LazyMotion features={domAnimation}>
            <style dangerouslySetInnerHTML={{
                __html: `
                video::cue {
                    visibility: hidden !important;
                    opacity: 0 !important;
                    font-size: 0 !important;
                }
            `}} />
            {loading ? (
                <LoadingState />
            ) : !episodeData ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Gagal memuat video</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href="/dramawave" className="mt-4 rounded-lg bg-purple-600 px-6 py-2 text-white transition-hover hover:bg-purple-500">
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
                        <Link href="/dramawave" className="hover:text-purple-400 transition-colors">DramaWave</Link>
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
                                        crossOrigin="anonymous" // Needed to load VTT from another domain/proxy properly
                                        controlsList="nodownload"
                                        onEnded={handleEnded}
                                    >
                                        Browser Anda tidak mendukung tag video.
                                    </video>

                                    {/* Custom Subtitle Overlay — always at fixed position */}
                                    {currentSubtitle && (
                                        <div
                                            className="absolute left-0 right-0 z-30 flex justify-center pointer-events-none"
                                            style={{ bottom: '18%' }}
                                        >
                                            <p
                                                style={{
                                                    color: 'white',
                                                    fontSize: 'clamp(14px, 2.2vw, 22px)',
                                                    fontWeight: 600,
                                                    textShadow: '1px 1px 4px black, -1px -1px 4px black, 1px -1px 4px black, -1px 1px 4px black, 0 2px 6px rgba(0,0,0,0.9)',
                                                    textAlign: 'center',
                                                    maxWidth: '85%',
                                                    lineHeight: 1.4,
                                                    whiteSpace: 'pre-line',
                                                }}
                                            >
                                                {currentSubtitle}
                                            </p>
                                        </div>
                                    )}

                                    {isFetchingSubsequent && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white transition-opacity duration-300">
                                            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-purple-500" />
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
                                {/* Cover Thumbnail */}
                                {cover && (
                                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-800 hidden sm:block">
                                        <Image
                                            src={cover}
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
                                    <h2 className="mt-2 text-lg font-medium text-purple-400">
                                        Episode {currentChapterNum}
                                    </h2>

                                    {/* Stats */}
                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-1">
                                            📑 {chapters} Total Episodes
                                        </span>
                                    </div>

                                    <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-2xl">
                                        Anda sedang menonton DramaWave streaming. Episode selanjutnya akan berjalan otomatis. Kredit akun Anda akan terpotong secara otomatis per episode.
                                    </p>
                                </div>
                            </m.div>
                        </div>

                        {/* Right Column: Episode List */}
                        <m.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full lg:w-[30%]"
                        >
                            <div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-2xl bg-neutral-100 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden isolate">
                                <div className="flex-none border-b border-black/5 dark:border-white/10 p-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md z-10">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Daftar Episode</h3>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Total {chapters} Episode</p>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto p-2 overscroll-contain"
                                    onWheel={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        {episodeList.map((chapNum) => (
                                            <button
                                                key={chapNum}
                                                id={`chapter-${chapNum}`}
                                                disabled={isFetchingSubsequent && currentChapterNum !== chapNum}
                                                onClick={() => {
                                                    if (currentChapterNum === chapNum) return;
                                                    fetchChapter(chapNum);
                                                }}
                                                className={`flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-black/5 dark:hover:bg-white/10 text-left ${currentChapterNum === chapNum
                                                    ? "bg-purple-500/10 dark:bg-purple-600/20 ring-1 ring-purple-500/30 dark:ring-purple-500/50"
                                                    : "bg-transparent"
                                                    }`}
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 text-sm font-bold text-neutral-700 dark:text-white">
                                                    {chapNum}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`truncate text-sm font-medium ${currentChapterNum === chapNum ? "text-purple-600 dark:text-purple-400" : "text-neutral-900 dark:text-white"
                                                        }`}>
                                                        Episode {chapNum}
                                                    </p>
                                                </div>
                                                {currentChapterNum === chapNum && (
                                                    <div className="flex items-center gap-[2px]">
                                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0s' }} />
                                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0.1s' }} />
                                                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0.2s' }} />
                                                    </div>
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

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
