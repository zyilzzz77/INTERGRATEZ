"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m } from "framer-motion";
import UrlInput from "./UrlInput";
import SkeletonCard from "@/components/SkeletonCard";
import { Badge } from "@/components/ui/badge";

const VideoPreviewCard = dynamic(() => import("@/components/VideoPreviewCard"), {
    loading: () => <SkeletonCard />,
});

function HeroContent({ dict }: { dict: any }) {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result && !loading && resultRef.current) {
            // Memberikan sedikit delay agar animasi render selesai sebelum scroll
            setTimeout(() => {
                const headerOffset = 80; // tinggi navbar
                const elementPosition = resultRef.current?.getBoundingClientRect().top || 0;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }, 100);
        }
    }, [result, loading]);

    return (
        <LazyMotion features={domAnimation}>
            <div className="relative mx-auto max-w-4xl pt-2 pb-6">
                {/* Title */}
                <h1 className="text-center text-4xl font-black mb-2 animate-fadeInUp text-foreground sm:text-5xl lg:text-6xl tracking-wide">
                    inversave
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mt-1 mb-6 max-w-2xl text-center text-base font-bold text-black sm:text-lg animate-fadeInUp">
                    {dict.heroDescription || "Download video, audio, dan foto dari berbagai platform favoritmu dalam satu tempat."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Main Action Card */}
                    <div className="md:col-span-2 relative bg-[#a0d1d6] border-[3px] border-black rounded-2xl p-6 sm:p-10 shadow-neo transition-transform duration-300">
                        <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6">
                            <span className="inline-block bg-white text-destructive font-black px-4 py-2 text-sm md:text-base border-[3px] border-black rounded-xl shadow-neo-sm rotate-6 transform hover:rotate-12 transition-transform cursor-pointer">
                                FREE !
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Mulai Download</h2>
                            <p className="text-black/80 font-medium mb-4">Paste link video, musik, atau foto di bawah ini.</p>
                            
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <UrlInput
                                    onResult={setResult}
                                    onLoading={setLoading}
                                    onPlatform={setDetectedPlatform}
                                />
                            </m.div>

                            <div id="toast-anchor" className="mt-2" />

                            {/* Detected platform badge */}
                            {detectedPlatform && !loading && !result && (
                                <m.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-4 text-sm font-bold text-black bg-white/50 border-[2px] border-black rounded-lg px-4 py-2 inline-flex items-center self-start shadow-neo-sm"
                                >
                                    {dict.heroDetectedPlatform || "Platform terdeteksi:"}
                                    <span className="ml-2 uppercase text-primary font-black bg-black text-white px-2 py-0.5 rounded-sm">
                                        {detectedPlatform}
                                    </span>
                                </m.div>
                            )}
                        </div>
                    </div>

                    {/* Result Section */}
                    {loading && (
                        <div className="md:col-span-2 border-[3px] border-black rounded-2xl bg-white shadow-neo p-4">
                            <SkeletonCard />
                        </div>
                    )}
                    {result && !loading && (
                        <m.div
                            ref={resultRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                            className="md:col-span-2 bg-[#c4b5fd] border-[3px] border-black rounded-2xl p-6 shadow-neo mt-6 scroll-mt-24"
                        >
                            <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-2">
                                ✨ Berhasil Diproses!
                            </h2>
                            <VideoPreviewCard data={result} />
                        </m.div>
                    )}
                </div>
            </div>
        </LazyMotion>
    );
}

export default function HeroSection({ dict }: { dict: any }) {
    return (
        <section className="relative px-4 sm:px-6 pt-4 sm:pt-8 max-w-7xl mx-auto">
            <Suspense fallback={<div className="h-96" />}>
                <HeroContent dict={dict} />
            </Suspense>
        </section>
    );
}
