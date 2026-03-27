"use client";

import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchPageClient({ dict, lang }: { dict: any; lang: string }) {
    const text = dict.search;

    const searchPlatforms = [
        {
            href: `/${lang}/search/youtube`,
            label: "YouTube",
            description: text.ytDesc,
            icon: <Image src="/logo-yt.webp" alt="YouTube" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/tiktok`,
            label: "TikTok",
            description: text.ttDesc,
            icon: <Image src="/logo-tiktok.webp" alt="TikTok" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/instagram`,
            label: "Instagram",
            description: text.igDesc,
            icon: <Image src="/logo-instagram.webp" alt="Instagram" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/spotify`,
            label: "Spotify",
            description: text.spDesc,
            icon: <Image src="/logo-spotify.webp" alt="Spotify" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/pinterest`,
            label: "Pinterest",
            description: text.pinDesc,
            icon: <Image src="/logo-pinterest.webp" alt="Pinterest" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/bilibili`,
            label: "Bilibili",
            description: text.bliDesc,
            icon: <Image src="/logo-bilibili.webp" alt="Bilibili" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/applemusic`,
            label: "Apple Music",
            description: text.amDesc,
            icon: <Image src="/logo-apple-music.webp" alt="Apple Music" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/search/soundcloud`,
            label: "SoundCloud",
            description: text.scDesc,
            icon: <Image src="/logo-soundcloud.webp" alt="SoundCloud" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/dramabox`,
            label: "DramaBox",
            description: text.drmBxDesc,
            icon: <Image src="/logo-dramabox.webp" alt="DramaBox" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/dramawave`,
            label: "DramaWave",
            description: text.drmWvDesc,
            icon: <Image src="/logo-dramawave.png" alt="DramaWave" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/melolo`,
            label: "Melolo Drama",
            description: text.mllDesc,
            icon: <Image src="/logo-melolo.webp" alt="Melolo" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/netshort`,
            label: "Netshort",
            description: text.nsDesc,
            icon: <Image src="/logo-netshort.png" alt="Netshort" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/stardusttv`,
            label: "StardustTV",
            description: text.sttvDesc,
            icon: <Image src="/logo-stardusttv.png" alt="StardustTV" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
        {
            href: `/${lang}/flickreels`,
            label: "FlickReels",
            description: text.frDesc || "Nonton Drama FlickReels Gratis",
            icon: <Image src="/logo-flickreels.png" alt="FlickReels" width={56} height={56} className="h-10 w-10 border border-neutral-200 rounded-xl object-cover sm:h-12 sm:w-12 bg-black" />,
        },
        {
            href: `/${lang}/search/dracin`,
            label: "iQIYI Streaming",
            description: text.iqiDesc,
            icon: <Image src="/logo-drakor.webp" alt="iQIYI" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-5xl px-4 py-10 font-sans min-h-screen bg-white text-black space-y-12">
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center sm:text-left bg-[#e8e6d7] border-[3px] border-black p-6 rounded-2xl shadow-neo"
                >
                    <h1 className="text-3xl font-black text-black tracking-tight sm:text-4xl">
                        {text.title}
                    </h1>
                    <p className="mt-2 text-black/80 font-bold">
                        {text.subtitle}
                    </p>
                </m.div>

                {/* Section: Social Media */}
                <div>
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6 flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-[#a0d1d6] border-[3px] border-black shadow-neo-sm flex items-center justify-center -rotate-1">
                            <Search className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-black sm:text-3xl">
                            {text.socialMedia}
                        </h2>
                    </m.div>

                    <m.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {searchPlatforms.map((p, index) => {
                            return (
                            <m.div key={p.href} variants={item}>
                                <Link href={p.href} className="block h-full">
                                    <div className={`h-full cursor-pointer transition-all duration-300 border-[3px] border-black rounded-2xl shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo bg-white group`}> 
                                        <div className="p-5 sm:p-6 flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[#e8e6d7] border-[3px] border-black flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 sm:w-16 sm:h-16 overflow-hidden shadow-neo-sm">
                                                {p.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-black text-black text-lg sm:text-xl truncate">{p.label}</h3>
                                                    <ChevronRight className="w-5 h-5 text-black font-black shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                                                </div>
                                                <p className="text-sm font-bold text-black/80 leading-relaxed line-clamp-2">
                                                    {p.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </m.div>
                            );
                        })}
                    </m.div>
                </div>
            </div>
        </LazyMotion>
    );
}
