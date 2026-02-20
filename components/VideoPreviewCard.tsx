"use client";

import { useState } from "react";
import PlatformDetector from "./PlatformDetector";
import { downloadMedia } from "@/lib/downloads";

interface Format {
    quality: string;
    url: string;
    type: string;
}

interface VideoData {
    title: string;
    thumbnail: string;
    duration: string;
    platform: string;
    formats: Format[];
    artist?: string;
    album?: string;
    release_date?: string;
}

export default function VideoPreviewCard({ data }: { data: VideoData }) {
    const [tab, setTab] = useState<"video" | "audio">("video");

    const videoFormats = data.formats.filter((f) => f.type !== "mp3");
    const audioFormats = data.formats.filter((f) => f.type === "mp3");
    const isYouTube = data.platform === "youtube";
    const activeFormats = tab === "audio" ? audioFormats : videoFormats;
    const allFormats = isYouTube ? activeFormats : data.formats;

    return (
        <div className="card-hover mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-md backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative shrink-0 overflow-hidden bg-neutral-800 sm:w-56">
                    {data.thumbnail ? (
                        <img
                            src={data.thumbnail}
                            alt={data.title}
                            className="h-44 w-full object-cover sm:h-full"
                        />
                    ) : (
                        <div className="flex h-44 w-full items-center justify-center text-4xl text-neutral-600 sm:h-full">
                            ▶
                        </div>
                    )}
                    {data.duration && data.duration !== "-" && (
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                            {data.duration}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-base font-bold leading-snug text-white">
                            {data.title}
                        </h3>
                        <PlatformDetector platform={data.platform} />
                    </div>

                    {(data.artist || data.album || data.release_date) && (
                        <div className="flex flex-col gap-1 text-xs text-neutral-400">
                            {data.artist && (
                                <span className="line-clamp-1">🎤 {data.artist}</span>
                            )}
                            {data.album && (
                                <span className="line-clamp-1">💿 {data.album}</span>
                            )}
                            {data.release_date && (
                                <span>📅 {data.release_date}</span>
                            )}
                        </div>
                    )}

                    {/* YouTube tab toggle */}
                    {isYouTube && audioFormats.length > 0 && (
                        <div className="flex gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
                            <button
                                onClick={() => setTab("video")}
                                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition ${tab === "video"
                                    ? "bg-white text-black shadow"
                                    : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                🎬 Video (MP4)
                            </button>
                            <button
                                onClick={() => setTab("audio")}
                                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition ${tab === "audio"
                                    ? "bg-white text-black shadow"
                                    : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                🎵 Audio (MP3)
                            </button>
                        </div>
                    )}

                    {/* Download buttons */}
                    <div className="mt-auto flex flex-wrap gap-2">
                        {allFormats.length > 0 ? (
                            allFormats.map((f, i) => (
                                <a
                                    key={i}
                                    href={f.url}
                                    className={`btn-shine inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition ${f.url
                                        ? "bg-white text-black hover:bg-neutral-200"
                                        : "cursor-not-allowed bg-neutral-700 text-neutral-500"
                                        }`}
                                    title={!f.url ? "Format tidak tersedia" : `Download ${f.quality}`}
                                    onClick={(e) => {
                                        if (!f.url) {
                                            e.preventDefault();
                                            return;
                                        }
                                        // Extract filename from URL if possible, or construct one
                                        let filename = "download";
                                        try {
                                            const urlObj = new URL(f.url, window.location.origin);
                                            const fnParam = urlObj.searchParams.get("filename");
                                            if (fnParam) filename = fnParam;
                                        } catch { /* ignore */ }
                                        
                                        downloadMedia(e, f.url, filename);
                                    }}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                    </svg>
                                    {f.quality} ({f.type.toUpperCase()})
                                </a>
                            ))
                        ) : (
                            <span className="text-sm text-neutral-500">Tidak ada format tersedia</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
