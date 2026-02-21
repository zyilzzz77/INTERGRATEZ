"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m } from "framer-motion";
import UrlInput from "./UrlInput";
import SkeletonCard from "@/components/SkeletonCard";
import { Badge } from "@/components/ui/badge";

const VideoPreviewCard = dynamic(() => import("@/components/VideoPreviewCard"), {
    loading: () => <SkeletonCard />,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function HeroContent() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);

    return (
        <LazyMotion features={domAnimation}>
            <div className="relative mx-auto max-w-3xl text-center">
                <m.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 flex justify-center"
                >
                    <Badge variant="secondary" className="px-4 py-1.5 text-sm gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        8+ Platform Didukung
                    </Badge>
                </m.div>

                <m.h1 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl text-foreground"
                >
                    <span className="text-white">Inver</span><span className="text-neutral-400">save</span>
                </m.h1>

                <m.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg"
                >
                    Tools Downloader & Stream Premium — Nikmati kemudahan download video, audio, dan foto dari berbagai platform favoritmu dalam satu tempat.
                </m.p>

                {/* URL Input */}
                <m.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8"
                >
                    <UrlInput
                        onResult={setResult}
                        onLoading={setLoading}
                        onPlatform={setDetectedPlatform}
                    />
                </m.div>
                <div id="toast-anchor" className="mt-3 flex justify-center" />

                {/* Detected platform badge */}
                {detectedPlatform && !loading && !result && (
                    <m.p 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 text-sm font-medium text-muted-foreground"
                    >
                        Platform terdeteksi:{" "}
                        <Badge variant="outline" className="ml-2 font-bold uppercase">
                            {detectedPlatform}
                        </Badge>
                    </m.p>
                )}

                {/* Result Section */}
                <div className="mt-8 text-left">
                    {loading && <SkeletonCard />}
                    {result && !loading && (
                        <m.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        >
                            <VideoPreviewCard data={result} />
                        </m.div>
                    )}
                </div>
            </div>
        </LazyMotion>
    );
}

export default function HeroSection() {
    return (
        <section className="relative px-4 pb-12 pt-16 sm:pt-24">
            <Suspense fallback={<div className="h-96" />}>
                <HeroContent />
            </Suspense>
        </section>
    );
}
