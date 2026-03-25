"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllPlatforms } from "@/lib/platformDetector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PlatformCarousel() {
    const platforms = getAllPlatforms();
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: "center",
            dragFree: true
        },
        [
            Autoplay({ delay: 2000, stopOnInteraction: false })
        ]
    );

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const colors = ["bg-[#a0d1d6]", "bg-[#ffeb3b]", "bg-[#a0c4ff]", "bg-[#c5b3e6]", "bg-[#ffb3c6]"];

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-20 relative group/carousel">
            <h2 className="mb-8 text-center text-2xl font-black text-black">
                Platform yang Didukung
            </h2>

            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4 py-4">
                    {platforms.map((p, index) => {
                        const bgClass = colors[index % colors.length];
                        return (
                        <div key={`${p.name}-${index}`} className="flex-[0_0_140px] min-w-0 pl-4 sm:flex-[0_0_180px]">
                            <div className="p-1 h-full">
                                <Card className={`h-full border-[3px] border-black ${bgClass} shadow-neo-sm transition-transform hover:-translate-y-2 hover:shadow-neo group cursor-grab active:cursor-grabbing rounded-2xl`}>
                                    <CardContent className="flex flex-col items-center justify-center gap-3 p-5 sm:gap-4 sm:p-6">
                                        <div
                                            className="relative flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 sm:h-16 sm:w-16"
                                        >
                                            {p.icon.startsWith("/") ? (
                                                <Image
                                                    src={p.icon}
                                                    alt={p.label}
                                                    width={64}
                                                    height={64}
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : p.localIconSvg ? (
                                                <Image
                                                    src={p.localIconSvg}
                                                    alt={p.label}
                                                    width={32}
                                                    height={32}
                                                    className="h-8 w-8 text-black sm:h-10 sm:w-10"
                                                />
                                            ) : (
                                                <span className="text-4xl font-bold text-black sm:text-5xl">
                                                    {p.icon}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-xs font-black sm:text-sm bg-white border-2 border-black text-black">
                                            {p.label}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 opacity-100 sm:opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 pointer-events-none sm:pointer-events-auto">
                <button
                    className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-black bg-white shadow-neo-sm pointer-events-auto hover:bg-gray-100 transition-transform active:translate-y-1 active:shadow-none text-black"
                    onClick={scrollPrev}
                >
                    <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
                </button>
            </div>

            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 sm:translate-x-4 opacity-100 sm:opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 pointer-events-none sm:pointer-events-auto">
                <button
                    className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-black bg-white shadow-neo-sm pointer-events-auto hover:bg-gray-100 transition-transform active:translate-y-1 active:shadow-none text-black"
                    onClick={scrollNext}
                >
                    <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
