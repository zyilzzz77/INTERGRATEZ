"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import UrlInput from "./UrlInput";
import SkeletonCard from "@/components/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const VideoPreviewCard = dynamic(() => import("@/components/VideoPreviewCard"), {
    loading: () => <SkeletonCard />,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function HeroContent() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);

    return (
        <div className="relative mx-auto max-w-3xl text-center">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 flex justify-center"
            >
                <Badge variant="secondary" className="px-4 py-1.5 text-sm gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    8+ Platform Didukung
                </Badge>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl text-foreground"
            >
                <span className="text-white">Inver</span><span className="text-neutral-400">save</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg"
            >
                Video, audio, dan foto dari YouTube, TikTok, Instagram,
                Facebook, Twitter, Spotify — semua dalam satu tempat.
            </motion.p>

            {/* URL Input */}
            <motion.div 
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
            </motion.div>
            <div id="toast-anchor" className="mt-3 flex justify-center" />

            {/* Detected platform badge */}
            {detectedPlatform && !loading && !result && (
                <motion.p 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 text-sm font-medium text-muted-foreground"
                >
                    Platform terdeteksi:{" "}
                    <Badge variant="outline" className="ml-2 font-bold uppercase">
                        {detectedPlatform}
                    </Badge>
                </motion.p>
            )}

            {/* Result Section */}
            <div className="mt-8 text-left">
                {loading && <SkeletonCard />}
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    >
                        <VideoPreviewCard data={result} />
                    </motion.div>
                )}
            </div>
        </div>
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
