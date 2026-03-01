"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Hls from "hls.js";
import { LazyMotion, domAnimation, m } from "framer-motion";

function LoadingState() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative mb-8 flex items-center justify-center">
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
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/5 overflow-hidden">
                    <Image
                        src="/logo-pinterest.webp"
                        alt="Pinterest Logo"
                        width={80}
                        height={80}
                        className="h-full w-full object-contain p-2"
                    />
                </div>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-neutral-800">
                <m.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="h-full w-full rounded-full bg-red-500"
                />
            </div>
        </div>
    );
}

// Custom HLS Video Player component with full error handling
function HlsPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        let hls: Hls | null = null;

        // Proxy the m3u8 URL through our backend to add proper User-Agent
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
            className="h-full w-full max-h-[80vh] object-contain"
            controls
            playsInline
            controlsList="nodownload"
        />
    );
}

function WatchContent() {
    const searchParams = useSearchParams();

    const vParam = searchParams.get("v");
    const titleParam = searchParams.get("title");
    const pinnerNameParam = searchParams.get("pinnerName");
    const pinnerAvatarParam = searchParams.get("pinnerAvatar");
    const pinIdParam = searchParams.get("pinId") || "unknown";

    const [videoUrl, setVideoUrl] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);

    useEffect(() => {
        if (vParam) {
            try {
                setVideoUrl(atob(vParam));
            } catch {
                console.error("Invalid video URL format");
            }
        }
    }, [vParam]);

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

    // Fetch related videos
    const fetchRelated = useCallback(async () => {
        setLoadingRelated(true);
        try {
            // Extract short keywords from the title for better search results
            let query = "trending video";
            if (titleParam && titleParam !== "null" && titleParam !== "-") {
                // Take first 2-3 meaningful words from the title as search keywords
                const words = titleParam
                    .replace(/[^\w\s]/g, " ") // remove special chars
                    .split(/\s+/)
                    .filter(w => w.length > 2) // skip short words
                    .slice(0, 2);
                if (words.length > 0) {
                    query = words.join(" ");
                }
            }
            const res = await fetch(`/api/search/pinterest?q=${encodeURIComponent(query)}&type=video`);
            const data = await res.json();

            if (data.items) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filtered = data.items.filter((item: any) => item.id !== pinIdParam);
                setRelatedVideos(filtered.slice(0, 10));
            }
        } catch (error) {
            console.error("Failed to fetch related videos", error);
        } finally {
            setLoadingRelated(false);
        }
    }, [titleParam, pinIdParam]);

    useEffect(() => {
        fetchRelated();
    }, [fetchRelated]);

    if (!vParam) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-white">Video Tidak Ditemukan</h2>
                <p className="text-neutral-400 mt-2">Parameter video tidak valid atau telah kedaluwarsa.</p>
                <Link href="/search/pinterest" className="mt-6 rounded-lg bg-red-600 px-6 py-2 font-bold text-white transition hover:bg-red-500">
                    Kembali ke Pencarian
                </Link>
            </div>
        );
    }

    if (!videoUrl) {
        return <LoadingState />;
    }

    const displayTitle = titleParam && titleParam !== "null" && titleParam !== "-" ? titleParam : "Pinterest Video";

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto max-w-7xl px-4 py-8 sm:py-10"
            >
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-neutral-400">
                    <Link href="/search/pinterest" className="hover:text-red-400 transition-colors">Pinterest Search</Link>
                    <span>/</span>
                    <span className="truncate text-white">Watch</span>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Left Column: Player & Info */}
                    <div className="w-full lg:w-[70%]">
                        {/* Player */}
                        <div
                            className="relative aspect-[9/16] sm:aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <div className="h-full w-full bg-black flex items-center justify-center">
                                <HlsPlayer src={videoUrl} />
                            </div>
                        </div>

                        {/* Video Info */}
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6"
                        >
                            <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                {displayTitle}
                            </h1>

                            {pinnerNameParam && pinnerNameParam !== "null" && (
                                <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                                    {pinnerAvatarParam && pinnerAvatarParam !== "null" && (
                                        <Image
                                            src={atob(pinnerAvatarParam)}
                                            alt={pinnerNameParam}
                                            width={48}
                                            height={48}
                                            className="h-12 w-12 rounded-full object-cover"
                                            unoptimized
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-neutral-400">Diunggah oleh</p>
                                        <p className="font-bold text-white text-lg">{pinnerNameParam}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const { showToast } = await import("@/components/Toast");
                                            showToast("Sedang Memproses video... Tunggu Hingga Maksimal 2 menit", "info");

                                            try {
                                                const url = `/api/convert-m3u8?url=${encodeURIComponent(videoUrl)}`;
                                                const response = await fetch(url);

                                                if (!response.ok) {
                                                    throw new Error("Gagal memproses video");
                                                }

                                                showToast("Video berhasil diproses. Sedang mendownload...", "success");

                                                const blob = await response.blob();
                                                const downloadUrl = window.URL.createObjectURL(blob);

                                                const a = document.createElement('a');
                                                a.style.display = 'none';
                                                a.href = downloadUrl;
                                                a.download = `pinterest-video-${pinIdParam}.mp4`;
                                                document.body.appendChild(a);
                                                a.click();

                                                setTimeout(() => {
                                                    document.body.removeChild(a);
                                                    window.URL.revokeObjectURL(downloadUrl);
                                                    showToast("Download Video Selesai!", "success");
                                                }, 100);

                                            } catch (error) {
                                                console.error("Video conversion download error:", error);
                                                showToast("Gagal mengunduh video.", "error");
                                            }
                                        }}
                                        className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 shadow-lg shadow-red-500/20"
                                    >
                                        ⬇ Download (.mp4)
                                    </button>
                                </div>
                            )}
                        </m.div>
                    </div>

                    {/* Right Column: Related Videos List */}
                    <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full lg:w-[30%]"
                    >
                        <div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden isolate shadow-2xl">
                            <div className="flex-none border-b border-white/10 p-5 bg-neutral-900/80 backdrop-blur-md z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white">Video Terkait</h3>
                                    <p className="text-xs text-neutral-400 mt-1">Lebih banyak dari Pinterest</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <Image src="/logo-pinterest.webp" alt="Pinterest" width={16} height={16} className="opacity-80" />
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto p-3 overscroll-contain pb-6"
                                onWheel={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                            >
                                {loadingRelated ? (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                    </div>
                                ) : relatedVideos.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {relatedVideos.map((video) => (
                                            <Link
                                                href={`/pinterest/watch?v=${btoa(video.video_url)}&title=${encodeURIComponent(video.title || video.description || "-")}&pinnerName=${encodeURIComponent(video.pinner?.full_name || "-")}&pinnerAvatar=${btoa(video.pinner?.image_small_url || "")}&pinId=${video.id}`}
                                                key={video.id}
                                                className="group flex gap-3 rounded-xl p-2 transition-all hover:bg-white/10 bg-white/5 border border-white/5"
                                            >
                                                <div className="relative h-20 w-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                                                    {(video.image || video.image_original) ? (
                                                        <Image
                                                            src={video.image || video.image_original}
                                                            alt={video.title || "Related video"}
                                                            fill
                                                            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-neutral-600 text-xl">▶</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="h-8 w-8 rounded-full bg-red-500/90 flex items-center justify-center text-white shadow-lg backdrop-blur-sm pl-0.5">
                                                            ▶
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="line-clamp-2 text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                                                        {video.title && video.title !== "-" ? video.title : (video.description || "Pinterest Video")}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center gap-1.5 opacity-80">
                                                        {video.pinner?.image_small_url && (
                                                            <Image
                                                                src={video.pinner.image_small_url}
                                                                alt={video.pinner.full_name || "User"}
                                                                width={14}
                                                                height={14}
                                                                className="rounded-full"
                                                                unoptimized
                                                            />
                                                        )}
                                                        <p className="truncate text-[10px] text-neutral-400">
                                                            {video.pinner?.full_name || "Pinterest User"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-neutral-500 px-4 text-center">
                                        <div className="text-3xl mb-2">🔍</div>
                                        <p className="text-sm">Tidak ada video terkait yang ditemukan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </m.div>
                </div>
            </m.div>
        </LazyMotion>
    );
}

export default function PinterestWatchPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <WatchContent />
        </Suspense>
    );
}
