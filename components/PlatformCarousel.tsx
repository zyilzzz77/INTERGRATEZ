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

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-16 relative group/carousel">
            <h2 className="mb-8 text-center text-xl font-bold text-neutral-300">
                Platform yang Didukung
            </h2>
            
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4">
                    {platforms.map((p, index) => (
                        <div key={`${p.name}-${index}`} className="flex-[0_0_140px] min-w-0 pl-4 sm:flex-[0_0_180px]">
                            <div className="p-1">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-primary/30 group cursor-grab active:cursor-grabbing">
                                    <CardContent className="flex flex-col items-center justify-center gap-3 p-5 sm:gap-4 sm:p-6">
                                        <div 
                                            className="relative flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 sm:h-16 sm:w-16"
                                        >
                                            {p.icon.startsWith("/") ? (
                                                <Image
                                                    src={p.icon}
                                                    alt={p.label}
                                                    width={64}
                                                    height={64}
                                                    className="h-full w-full object-contain drop-shadow-lg"
                                                />
                                            ) : p.localIconSvg ? (
                                                <Image
                                                    src={p.localIconSvg}
                                                    alt={p.label}
                                                    width={32}
                                                    height={32}
                                                    className="h-8 w-8 invert sm:h-10 sm:w-10"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
                                                    {p.icon}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="bg-white/10 text-xs font-semibold text-white hover:bg-white/20 sm:text-sm">
                                            {p.label}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none sm:pointer-events-auto">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-full border border-white/10 bg-background/80 shadow-xl backdrop-blur-md pointer-events-auto hover:bg-background sm:h-12 sm:w-12"
                    onClick={scrollPrev}
                >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
            </div>
            
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 sm:translate-x-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none sm:pointer-events-auto">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 rounded-full border border-white/10 bg-background/80 shadow-xl backdrop-blur-md pointer-events-auto hover:bg-background sm:h-12 sm:w-12"
                    onClick={scrollNext}
                >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
            </div>
        </div>
    );
}
