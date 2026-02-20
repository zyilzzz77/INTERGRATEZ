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
                        <div key={`${p.name}-${index}`} className="flex-[0_0_150px] min-w-0 pl-4 sm:flex-[0_0_180px]">
                            <div className="p-1">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-primary/30 group cursor-grab active:cursor-grabbing">
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                                        <div 
                                            className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ring-1 ring-white/10 transition-transform group-hover:scale-110 group-hover:rotate-3"
                                            style={{ backgroundColor: p.color === "#ffffffff" ? "#000000" : p.color }}
                                        >
                                            {p.icon.startsWith("/") ? (
                                                <Image
                                                    src={p.icon}
                                                    alt={p.label}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            ) : p.localIconSvg ? (
                                                <Image
                                                    src={p.localIconSvg}
                                                    alt={p.label}
                                                    width={32}
                                                    height={32}
                                                    className="h-8 w-8 invert"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold text-white drop-shadow-md">
                                                    {p.icon}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="font-semibold bg-white/10 hover:bg-white/20 text-white">
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
                    className="h-12 w-12 rounded-full shadow-xl bg-background/80 backdrop-blur-md border border-white/10 hover:bg-background pointer-events-auto"
                    onClick={scrollPrev}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            </div>
            
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 sm:translate-x-8 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none sm:pointer-events-auto">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-xl bg-background/80 backdrop-blur-md border border-white/10 hover:bg-background pointer-events-auto"
                    onClick={scrollNext}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
