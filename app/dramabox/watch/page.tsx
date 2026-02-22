"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

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

interface Chapter {
    chapter: number;
    id: string;
    cover: string;
    title: string;
    duration: string;
    release_at: string;
    unlock: boolean;
    videoUrl: string;
}

interface DramaDetails {
    id: string;
    cover: string;
    title: string;
    statistics: {
        views: number;
        followers: number;
        chapters: number;
    };
    labels: string[];
    tags: string[];
    synopsis: string;
    chapters: Chapter[];
}

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            {/* Icon Container */}
            <div className="relative mb-8 flex items-center justify-center">
                {/* Outer pulsing ring */}
                <m.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.1, 0.05, 0.1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute h-28 w-28 rounded-full bg-white"
                />

                {/* Main Circle */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden">
                    <Image
                        src="/logo-dramabox.png"
                        alt="DramaBox Logo"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                    />
                </div>
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
                    className="h-full w-full rounded-full bg-white"
                />
            </div>
        </div>
    );
}

function WatchContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const uri = searchParams.get("uri");

    const [data, setData] = useState<DramaDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [tokenRetry, setTokenRetry] = useState(0);

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

    // Fetch drama data
    const fetchDramaData = async (selectChapterId?: string, isBackgroundRefresh = false) => {
        if (!id || !uri) return;
        try {
            const res = await fetch(`/api/dramabox?id=${id}&uri=${uri}&isRefresh=${isBackgroundRefresh}`);
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 403) {
                    alert(json.error || "Kredit tidak mencukupi");
                    window.location.href = "/topup";
                }
                console.error("API error:", json.error);
                return;
            }

            if (json.status && json.data) {
                setData(json.data);

                // Only update currentChapter if we are explicitly selecting one, or initial load
                if (!isBackgroundRefresh) {
                    if (selectChapterId && json.data.chapters) {
                        const found = json.data.chapters.find((c: Chapter) => c.id === selectChapterId);
                        if (found) setCurrentChapter(found);
                    } else if (json.data.chapters?.length > 0) {
                        setCurrentChapter(json.data.chapters[0]);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch drama details:", error);
        }
    };

    useEffect(() => {
        if (!id || !uri) return;

        // Initial load
        setLoading(true);
        fetchDramaData().finally(() => setLoading(false));

        // Background refresh every 10 minutes to keep next episode tokens fresh
        const interval = setInterval(() => {
            fetchDramaData(undefined, true);
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, uri]);

    const isFetchingRef = useRef<boolean>(false);

    // Auto-refresh tokens when video error (token expired)
    const handleVideoError = async () => {
        if (tokenRetry >= 2 || isFetchingRef.current) return; // max 2 retries, protect against concurrent calls
        isFetchingRef.current = true;
        console.warn(`Token expired, refreshing... (${tokenRetry + 1}/2)`);

        // Wait for the fresh data to arrive
        await fetchDramaData(currentChapter?.id);

        // Only trigger remount (by updating retry counter) AFTER we have the new URL
        setTokenRetry(prev => prev + 1);
        isFetchingRef.current = false;
    };

    const handleEnded = async () => {
        if (data && data.chapters && currentChapter) {
            const currentIndex = data.chapters.findIndex(c => c.id === currentChapter.id);
            if (currentIndex >= 0 && currentIndex < data.chapters.length - 1) {
                const nextChapter = data.chapters[currentIndex + 1];

                // Deduct credit for auto-playing next episode
                try {
                    const res = await fetch('/api/user/deduct-action', { method: 'POST' });
                    const resData = await res.json();
                    if (!resData.success) {
                        alert(resData.error || "Kredit tidak mencukupi untuk episode selanjutnya.");
                        window.location.href = '/topup';
                        return;
                    }

                    setCurrentChapter(nextChapter);
                    setTokenRetry(0); // reset retry for new episode

                    const nextButton = document.getElementById(`chapter-${nextChapter.id}`);
                    if (nextButton) {
                        nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (e) {
                    console.error("Failed auto play deduct", e);
                }
            }
        }
    };

    const videoUrl = currentChapter ? cleanUrl(currentChapter.videoUrl) : '';

    return (
        <LazyMotion features={domAnimation}>
            {loading ? (
                <LoadingState />
            ) : !data ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-white">Gagal memuat data</h2>
                    <p className="text-neutral-400">Silakan coba lagi nanti</p>
                    <Link href="/dramabox" className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white transition-hover hover:bg-red-500">
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
                        <Link href="/dramabox" className="hover:text-red-400 transition-colors">DramaBox</Link>
                        <span>/</span>
                        <span className="truncate text-white">{data.title}</span>
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Left Column: Player & Info */}
                        <div className="w-full lg:w-[70%]">
                            {/* Player */}
                            <div
                                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {currentChapter ? (
                                    <div className="h-full w-full bg-black flex items-center justify-center">
                                        <video
                                            key={`${currentChapter.id}-${tokenRetry}`}
                                            src={videoUrl}
                                            poster={cleanUrl(currentChapter.cover)}
                                            className="h-full w-full max-h-[80vh] object-contain"
                                            controls
                                            autoPlay
                                            playsInline
                                            controlsList="nodownload"
                                            onEnded={handleEnded}
                                            onError={handleVideoError}
                                        >
                                            Browser Anda tidak mendukung tag video.
                                        </video>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-neutral-500">
                                        Pilih episode untuk menonton
                                    </div>
                                )}
                            </div>

                            {/* Current Episode Info */}
                            <m.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-6"
                            >
                                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                    {data.title}
                                </h1>
                                <h2 className="mt-2 text-lg font-medium text-red-400">
                                    {currentChapter ? `Episode ${currentChapter.chapter}` : ''}
                                </h2>

                                {/* Stats */}
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        👁️ {data.statistics.views.toLocaleString()} Views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        ♥ {data.statistics.followers.toLocaleString()} Followers
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📑 {data.statistics.chapters} Episodes
                                    </span>
                                </div>

                                {/* Tags */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {data.labels.map((label, i) => (
                                        <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* Synopsis */}
                                <div className="mt-6 rounded-xl bg-white/5 p-6 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                                    <h3 className="mb-2 font-bold text-white">Sinopsis</h3>
                                    <p className="text-sm leading-relaxed text-neutral-300">
                                        {data.synopsis}
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
                            <div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden isolate">
                                <div className="flex-none border-b border-white/10 p-4 bg-neutral-900/50 backdrop-blur-md z-10">
                                    <h3 className="text-lg font-bold text-white">Daftar Episode</h3>
                                    <p className="text-xs text-neutral-400">Total {data.chapters.length} Episode</p>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto p-2 overscroll-contain"
                                    onWheel={(e) => e.stopPropagation()}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        {data.chapters.map((chapter) => (
                                            <button
                                                key={chapter.id}
                                                id={`chapter-${chapter.id}`}
                                                onClick={async () => {
                                                    if (currentChapter?.id === chapter.id) return;

                                                    // Deduct credit for manual episode change
                                                    try {
                                                        const res = await fetch('/api/user/deduct-action', { method: 'POST' });
                                                        const resData = await res.json();
                                                        if (!resData.success) {
                                                            alert(resData.error || "Kredit tidak mencukupi untuk memutar episode ini.");
                                                            window.location.href = '/topup';
                                                            return;
                                                        }

                                                        setCurrentChapter(chapter);
                                                        setTokenRetry(0);
                                                    } catch (e) {
                                                        console.error("Failed deduct action", e);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/10 text-left ${currentChapter?.id === chapter.id
                                                    ? "bg-red-600/20 ring-1 ring-red-500/50"
                                                    : "bg-transparent"
                                                    }`}
                                            >
                                                <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-black group">
                                                    <Image
                                                        src={cleanUrl(chapter.cover)}
                                                        alt={chapter.title}
                                                        width={96}
                                                        height={64}
                                                        className="h-full w-full object-cover opacity-80 transition-transform group-hover:scale-110"
                                                    />
                                                    <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
                                                        {chapter.duration}
                                                    </div>
                                                    {currentChapter?.id === chapter.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white mx-0.5" style={{ animationDelay: '0s' }} />
                                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white mx-0.5" style={{ animationDelay: '0.1s' }} />
                                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white mx-0.5" style={{ animationDelay: '0.2s' }} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`truncate text-sm font-medium ${currentChapter?.id === chapter.id ? "text-red-400" : "text-white"
                                                        }`}>
                                                        Episode {chapter.chapter}
                                                    </p>
                                                    <p className="text-[10px] text-neutral-500">
                                                        {chapter.release_at}
                                                    </p>
                                                </div>
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
