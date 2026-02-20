"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function BilibiliWatchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlParam = searchParams.get("url");
    const idParam = searchParams.get("id");
    const queryParam = searchParams.get("q");

    // Construct full URL if ID is provided, otherwise use url param
    const url = idParam 
        ? `https://www.bilibili.tv/id/video/${idParam}`
        : urlParam;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [meta, setMeta] = useState<{ title: string; views: string; likes: string } | null>(null);
    const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (!url) {
            setError("URL tidak valid");
            setLoading(false);
            return;
        }

        async function fetchVideo() {
            try {
                const res = await fetch(`/api/downloader/bilibili?url=${encodeURIComponent(url!)}`);
                const data = await res.json();

                if (data.error) {
                    setError(data.error);
                    return;
                }

                setMeta({
                    title: data.title || "Video Bilibili",
                    views: data.views || "-",
                    likes: data.likes || "-"
                });

                // Get audio URL
                let fetchedAudioUrl = "";
                if (data.audio && data.audio.length > 0) {
                    fetchedAudioUrl = data.audio[0].url;
                }

                // Prioritize finding highest quality (1080p -> 720p)
                let streamUrl = "";
                
                if (data.media && data.media.length > 0) {
                    // Try to find 1080p first
                    const quality1080 = data.media.find((m: any) => 
                        (m.quality && m.quality.includes("1080")) || 
                        (m.url && m.url.includes("1080"))
                    );

                    // Then try 720p
                    const quality720 = data.media.find((m: any) => 
                        (m.quality && m.quality.includes("720")) || 
                        (m.url && m.url.includes("720"))
                    );

                    // Fallback to akamai mirror or first available
                    const mirror = data.media.find((m: any) => 
                        m.url && m.url.includes("upos-bstar1-mirrorakam.akamaized.net")
                    );
                    
                    if (quality1080) {
                        streamUrl = quality1080.url;
                    } else if (quality720) {
                        streamUrl = quality720.url;
                    } else if (mirror) {
                        streamUrl = mirror.url;
                    } else {
                        streamUrl = data.media[0].url;
                    }
                }
                
                if (!streamUrl) {
                    streamUrl = data.directUrl;
                }

                if (streamUrl) {
                    const proxyVideo = `/api/proxy-download?url=${encodeURIComponent(streamUrl)}&filename=video.mp4`;
                    setVideoUrl(proxyVideo);

                    if (fetchedAudioUrl) {
                        const proxyAudio = `/api/proxy-download?url=${encodeURIComponent(fetchedAudioUrl)}&filename=audio.mp3`;
                        setAudioUrl(proxyAudio);
                    }
                } else {
                    setError("Tidak dapat menemukan stream video");
                }
            } catch (err) {
                setError("Terjadi kesalahan saat memuat video");
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();
    }, [url]);

    // Fetch related videos (search results)
    useEffect(() => {
        if (!queryParam) return;
        
        async function fetchRelated() {
            setRelatedLoading(true);
            try {
                const res = await fetch(`/api/search/bilibili?q=${encodeURIComponent(queryParam!)}`);
                const data = await res.json();
                if (data.items) {
                    // Filter out current video if possible (by title similarity or ID if available)
                    const filtered = data.items.filter((item: any) => 
                        item.videoUrl !== url && (!idParam || !item.videoUrl.includes(idParam))
                    );
                    setRelatedVideos(filtered);
                }
            } catch {
                // silent error
            } finally {
                setRelatedLoading(false);
            }
        }

        fetchRelated();
    }, [queryParam, url, idParam]);

    // Sync audio and video
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;

        if (!video || !audio) return;

        const onPlay = () => audio.play().catch(() => {});
        const onPause = () => audio.pause();
        const onSeek = () => { audio.currentTime = video.currentTime; };
        const onWaiting = () => audio.pause();
        const onPlaying = () => audio.play().catch(() => {});
        const onVolumeChange = () => { audio.volume = video.volume; audio.muted = video.muted; };

        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("seeking", onSeek);
        video.addEventListener("waiting", onWaiting);
        video.addEventListener("playing", onPlaying);
        video.addEventListener("volumechange", onVolumeChange);

        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("seeking", onSeek);
            video.removeEventListener("waiting", onWaiting);
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("volumechange", onVolumeChange);
        };
    }, [videoUrl, audioUrl]);

    function handleRelatedWatch(videoUrl: string) {
        if (!videoUrl) return;

        // Try to extract ID to make URL shorter
        const match = videoUrl.match(/video\/(\d+)/);
        const qParam = queryParam ? `&q=${encodeURIComponent(queryParam)}` : "";

        if (match && match[1]) {
            router.push(`/search/bilibili/watch?id=${match[1]}${qParam}`);
        } else {
            router.push(`/search/bilibili/watch?url=${encodeURIComponent(videoUrl)}${qParam}`);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-900 px-4 py-8">
            <div className="mx-auto max-w-[1600px]">
                {/* Back Button */}
                <button 
                    onClick={() => router.push('/search/bilibili')}
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
                        {loading ? (
                            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-white/5 text-white">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent shadow-lg shadow-sky-500/20" />
                                <p className="mt-4 animate-pulse font-medium">Memuat video...</p>
                            </div>
                        ) : error ? (
                            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-white/5 p-8 text-center text-white">
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
                            <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
                                {/* Player */}
                                <div className="relative aspect-video w-full bg-black">
                                    <video
                                        ref={videoRef}
                                        src={videoUrl!}
                                        controls
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        controlsList="nodownload"
                                        crossOrigin="anonymous"
                                        onContextMenu={(e) => e.preventDefault()}
                                    >
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                    {/* Hidden Audio Player */}
                                    {audioUrl && (
                                        <audio 
                                            ref={audioRef}
                                            src={audioUrl}
                                            preload="auto"
                                            className="hidden"
                                        />
                                    )}
                                </div>

                                {/* Metadata */}
                                <div className="border-t border-white/10 bg-neutral-900 p-6">
                                    <h1 className="text-xl font-bold text-white md:text-2xl">{meta?.title}</h1>
                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                                        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                                            <span>👁</span>
                                            <span>{meta?.views} Views</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                                            <span>❤️</span>
                                            <span>{meta?.likes} Likes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Related Videos */}
                    <div className="lg:col-span-1">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Video Terkait</h3>
                            {queryParam && (
                                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
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
                                        onClick={() => handleRelatedWatch(item.videoUrl)}
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
                                            
                                            <span className="absolute bottom-1 right-1 z-20 rounded bg-black/80 px-1 py-0.5 text-[10px] font-bold text-white">
                                                {item.duration}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center">
                                            <h4 className="line-clamp-2 text-sm font-medium text-neutral-200 group-hover:text-sky-400">
                                                {item.title}
                                            </h4>
                                            <p className="mt-1 text-xs text-neutral-500">
                                                {item.author}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {item.views.replace("· ", "")} views
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
                                    <p className="text-sm text-neutral-500">
                                        {queryParam ? "Tidak ada video terkait lainnya." : "Lakukan pencarian untuk melihat video terkait."}
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