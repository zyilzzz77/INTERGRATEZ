"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import UrlInput from "./UrlInput";
import SkeletonCard from "@/components/SkeletonCard";

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
            <div className="float-anim mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-neutral-300">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                8+ Platform Didukung
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-sky-300">INTERGRATEZ</span>{" "}
                <span className="text-white">TOOLS</span>
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base text-neutral-400 sm:text-lg">
                Video, audio, dan foto dari YouTube, TikTok, Instagram,
                Facebook, Twitter, Spotify — semua dalam satu tempat.
            </p>

            {/* URL Input */}
            <div className="mt-8">
                <UrlInput
                    onResult={setResult}
                    onLoading={setLoading}
                    onPlatform={setDetectedPlatform}
                />
            </div>

            {/* Detected platform badge */}
            {detectedPlatform && !loading && !result && (
                <p className="mt-3 text-sm font-medium text-neutral-300">
                    Platform terdeteksi:{" "}
                    <span className="font-bold uppercase text-white">
                        {detectedPlatform}
                    </span>
                </p>
            )}

            {/* Result Section */}
            <div className="mt-8 text-left">
                {loading && <SkeletonCard />}
                {result && !loading && <VideoPreviewCard data={result} />}
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
