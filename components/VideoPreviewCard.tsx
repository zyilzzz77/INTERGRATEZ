"use client";

import { useState, useEffect } from "react";
import PlatformDetector from "./PlatformDetector";
import { downloadMedia } from "@/lib/downloads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Music, Download, Calendar, Disc, Mic, AlertCircle } from "lucide-react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

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

export default function VideoPreviewCard({ data }: { data: VideoData | null }) {
    const [tab, setTab] = useState<"video" | "audio">("video");

    // Safety check: if data is null or missing, don't render or render error
    if (!data) {
        return (
            <div className="p-4 text-center text-red-400 bg-red-900/20 rounded-lg border border-red-900/50">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p>Data tidak tersedia.</p>
            </div>
        );
    }

    // Safety check for formats array
    const formats = Array.isArray(data.formats) ? data.formats : [];

    const imageFormats = formats.filter((f) => (f.type || "").toLowerCase() === "jpg");

    const videoFormats = formats.filter((f) => f.type !== "mp3");
    const audioFormats = formats.filter((f) => f.type === "mp3");
    const isYouTube = data.platform === "youtube";
    const activeFormats = tab === "audio" ? audioFormats : videoFormats;
    const formatsToShow = isYouTube ? activeFormats : formats;

    const handleDownloadAllImages = () => {
        if (!imageFormats.length) return;
        imageFormats.forEach((f, idx) => {
            const ext = (f.type || "jpg").replace(/\./g, "") || "jpg";
            const filename = `instagram-image-${idx + 1}.${ext}`;
            downloadMedia(null, f.url, filename);
        });
    };

    console.log("[VideoPreviewCard] Rendering with data:", { title: data.title, formatsCount: formats.length });

    return (
        <LazyMotion features={domAnimation}>
            <Card className="mx-auto w-full max-w-2xl overflow-hidden border-[3px] border-black bg-white shadow-neo rounded-2xl">
                <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative shrink-0 overflow-hidden bg-gray-100 sm:w-56 border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-black">
                        {data.thumbnail ? (
                            <m.img
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                src={data.thumbnail}
                                alt={data.title}
                                className="h-48 w-full object-cover sm:h-full transition-transform hover:scale-105 duration-500"
                            />
                        ) : (
                            <div className="flex h-48 w-full items-center justify-center text-4xl text-gray-300 sm:h-full">
                                <PlayCircle className="h-12 w-12" />
                            </div>
                        )}
                        {data.duration && data.duration !== "-" && (
                            <m.span
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-2 right-2 rounded-lg bg-black px-2 py-0.5 text-xs font-black text-white border-[2px] border-white"
                            >
                                {data.duration}
                            </m.span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col bg-[#fff6e8]">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="line-clamp-2 text-base font-bold leading-snug text-black">
                                    {data.title || "No Title"}
                                </CardTitle>
                                <PlatformDetector platform={data.platform} />
                            </div>
                            {(data.artist || data.album || data.release_date) && (
                                <m.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col gap-1 text-xs text-gray-700 mt-2 font-medium"
                                >
                                    {data.artist && (
                                        <div className="flex items-center gap-1 line-clamp-1">
                                            <Mic className="h-3 w-3" /> {data.artist}
                                        </div>
                                    )}
                                    {data.album && (
                                        <div className="flex items-center gap-1 line-clamp-1">
                                            <Disc className="h-3 w-3" /> {data.album}
                                        </div>
                                    )}
                                    {data.release_date && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {data.release_date}
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </CardHeader>

                        <CardContent className="p-4 pt-0 grow">
                            {data.platform === "instagram" && imageFormats.length > 0 && (
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#ffe8f2] border-[3px] border-black px-3 py-2 shadow-neo-sm">
                                    <span className="text-sm font-black text-black">Instagram Media</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleDownloadAllImages}
                                        className="h-8 gap-2 rounded-lg bg-[#ff4f9a] border-[2px] border-black px-3 text-xs font-black text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Download All Images
                                    </Button>
                                </div>
                            )}

                            {/* YouTube tab toggle */}
                            {isYouTube && audioFormats.length > 0 && (
                                <div className="flex gap-1 rounded-xl bg-white border-[3px] border-black p-1 mb-4 shadow-neo-sm">
                                    <Button
                                        variant={tab === "video" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setTab("video")}
                                        className={`flex-1 text-xs font-bold h-8 relative rounded-lg ${tab === "video" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center">
                                            <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Video (MP4)
                                        </span>
                                    </Button>
                                    <Button
                                        variant={tab === "audio" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setTab("audio")}
                                        className={`flex-1 text-xs font-bold h-8 relative rounded-lg ${tab === "audio" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center">
                                            <Music className="mr-1.5 h-3.5 w-3.5" /> Audio (MP3)
                                        </span>
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 flex-wrap">
                                <AnimatePresence mode="popLayout">
                                    {formatsToShow.length > 0 ? (
                                        formatsToShow.map((f, i) => (
                                            <m.div
                                                key={`${f.quality}-${i}`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        if (!f.url) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        let filename = "download";
                                                        try {
                                                            const urlObj = new URL(f.url, window.location.origin);
                                                            const fnParam = urlObj.searchParams.get("filename");
                                                            if (fnParam) filename = fnParam;
                                                        } catch { /* ignore */ }

                                                        downloadMedia(e, f.url, filename);
                                                    }}
                                                    disabled={!f.url}
                                                    className="w-full justify-start gap-2 overflow-hidden text-xs font-bold bg-[#c5b3e6] border-[2px] border-black text-black hover:bg-[#b09ed1] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-px hover:translate-x-px hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all"
                                                    title={!f.url ? "Format tidak tersedia" : `Download ${f.quality}`}
                                                >
                                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">{f.quality}</span>
                                                </Button>
                                            </m.div>
                                        ))
                                    ) : (
                                        <m.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="col-span-full py-2 text-center text-sm font-bold text-gray-500"
                                        >
                                            Tidak ada format tersedia untuk kategori ini.
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </LazyMotion>
    );
}
