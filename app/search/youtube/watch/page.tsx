"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface YTResult {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channel: string;
    publishedAt: string;
    url: string;
    views: string;
    duration: string;
}

export default function YouTubeWatchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlParam = searchParams.get("url");
    const queryParam = searchParams.get("q");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [meta, setMeta] = useState<{ title: string; thumbnail: string; duration: number } | null>(null);
    const [relatedVideos, setRelatedVideos] = useState<YTResult[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch Video Data
    useEffect(() => {
        if (!urlParam) {
            setError("URL tidak valid");
            setLoading(false);
            return;
        }

        async function fetchVideo() {
            try {
                // Fetch directly from NexRay API as requested (No v1, 1440p)
                const apiUrl = `https://api.nexray.web.id/downloader/ytmp4?url=${encodeURIComponent(urlParam!)}&resolusi=1440`;
                const res = await fetch(apiUrl);
                const data = await res.json();

                if (!data.status || !data.result) {
                    setError("Gagal mengambil data video");
                    return;
                }

                const result = data.result;

                setMeta({
                    title: result.title || "YouTube Video",
                    thumbnail: result.thumbnail || "",
                    duration: result.duration || 0
                });

                if (result.url) {
                    // Use proxy to avoid CORS issues and ensure playback
                    const proxyVideo = `/api/proxy-download?url=${encodeURIComponent(result.url)}&filename=video.mp4`;
                    setVideoUrl(proxyVideo);
                } else {
                    setError("Stream URL tidak ditemukan");
                }
            } catch (err) {
                console.error(err);
                setError("Terjadi kesalahan saat memuat video");
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();
    }, [urlParam]);

    // Fetch Related Videos (using query)
    useEffect(() => {
        if (!queryParam) return;

        async function fetchRelated() {
            setRelatedLoading(true);
            try {
                const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(queryParam!)}`);
                const data = await res.json();
                if (data.items) {
                    // Filter out the current video if possible (by url match)
                    const filtered = data.items.filter((item: YTResult) => item.url !== urlParam);
                    setRelatedVideos(filtered);
                }
            } catch {
                // silent error
            } finally {
                setRelatedLoading(false);
            }
        }

        fetchRelated();
    }, [queryParam, urlParam]);

    const handleRelatedWatch = (url: string) => {
        // Navigate to watch page with new URL but keep the same query for related context
        router.push(`/search/youtube/watch?url=${encodeURIComponent(url)}&q=${encodeURIComponent(queryParam || "")}`);
    };

    return (
        <div className="min-h-screen bg-neutral-900 px-4 py-8">
            <div className="mx-auto max-w-[1600px]">
                {/* Back Button */}
                <button 
                    onClick={() => router.push('/search/youtube')}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-white"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Pencarian
                </button>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 xl:grid-cols-4">
                    {/* Left Column: Player (Span 2 on LG, Span 3 on XL) */}
                    <div className="lg:col-span-2 xl:col-span-3">
                        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
                            {loading ? (
                                <div className="flex aspect-video w-full flex-col items-center justify-center bg-white/5 text-white">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent shadow-lg shadow-red-500/20" />
                                    <p className="mt-4 animate-pulse font-medium">Memuat video...</p>
                                </div>
                            ) : error ? (
                                <div className="flex aspect-video w-full flex-col items-center justify-center bg-white/5 p-8 text-center text-white">
                                    <div className="rounded-full bg-red-500/10 p-6 text-red-500 ring-1 ring-red-500/20">
                                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-xl font-bold text-red-400">Gagal Memutar Video</p>
                                        <p className="mt-2 text-neutral-400">{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Player */}
                                    <div className="relative aspect-video w-full bg-black">
                                        <video
                                            ref={videoRef}
                                            src={videoUrl!}
                                            controls
                                            autoPlay
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            controlsList="nodownload"
                                            onContextMenu={(e) => e.preventDefault()}
                                        >
                                            Browser Anda tidak mendukung tag video.
                                        </video>
                                    </div>

                                    {/* Metadata */}
                                    <div className="border-t border-white/10 bg-neutral-900 p-6">
                                        <h1 className="text-xl font-bold text-white md:text-2xl">{meta?.title}</h1>
                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                                            {meta?.duration && (
                                                <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                                                    <span>⏱️</span>
                                                    <span>{Math.floor(meta.duration / 60)}:{String(meta.duration % 60).padStart(2, '0')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Related Videos */}
                    <div className="lg:col-span-1">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Video Lainnya</h3>
                            {queryParam && (
                                <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                                    "{queryParam}"
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            {relatedLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 rounded-lg border border-white/5 bg-white/5 p-2">
                                        <div className="skeleton aspect-video w-32 rounded bg-neutral-800" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="skeleton h-3 w-full rounded bg-neutral-800" />
                                            <div className="skeleton h-3 w-2/3 rounded bg-neutral-800" />
                                        </div>
                                    </div>
                                ))
                            ) : relatedVideos.length > 0 ? (
                                relatedVideos.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="group flex cursor-pointer gap-3 rounded-lg border border-transparent p-2 transition hover:bg-white/5"
                                        onClick={() => handleRelatedWatch(item.url)}
                                    >
                                        <div className="relative aspect-video w-36 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                                            <img 
                                                src={item.thumbnail} 
                                                alt={item.title}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onContextMenu={(e) => e.preventDefault()}
                                                draggable={false}
                                            />
                                            {/* Transparent Overlay for protection */}
                                            <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                                            
                                            {item.duration && (
                                                <span className="absolute bottom-1 right-1 z-20 rounded bg-black/80 px-1 py-0.5 text-[10px] font-bold text-white">
                                                    {item.duration}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center">
                                            <h4 className="line-clamp-2 text-sm font-medium text-neutral-200 group-hover:text-red-400">
                                                {item.title}
                                            </h4>
                                            <p className="mt-1 text-xs text-neutral-500">
                                                {item.channel}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {item.views} views
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
                                    <p className="text-sm text-neutral-500">
                                        {queryParam ? "Tidak ada video lainnya." : "Lakukan pencarian untuk melihat daftar putar."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
