"use client";

import Link from "next/link";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ChevronRight, Search, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const searchPlatforms = [
    {
        href: "/search/youtube",
        label: "YouTube",
        description: "Cari video, lihat durasi & views, lalu download MP4/MP3",
        icon: <Image src="/logo-yt.webp" alt="YouTube" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/tiktok",
        label: "TikTok",
        description: "Cari video TikTok, lihat stats & download",
        icon: <Image src="/logo-tiktok.webp" alt="TikTok" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/instagram",
        label: "Instagram",
        description: "Stalk profil IG — lihat followers, posts & bio",
        icon: <Image src="/logo-instagram.webp" alt="Instagram" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/spotify",
        label: "Spotify",
        description: "Cari lagu favorit, preview 30 detik, download audio",
        icon: <Image src="/logo-spotify.webp" alt="Spotify" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/pinterest",
        label: "Pinterest",
        description: "Cari foto & gambar inspirasi, download HD",
        icon: <Image src="/logo-pinterest.webp" alt="Pinterest" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/bilibili",
        label: "Bilibili",
        description: "Cari video Bilibili, lihat durasi & views",
        icon: <Image src="/logo-bilibili.webp" alt="Bilibili" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/applemusic",
        label: "Apple Music",
        description: "Download lagu & album dari Apple Music kualitas tinggi",
        icon: <Image src="/logo-apple-music.webp" alt="Apple Music" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/soundcloud",
        label: "SoundCloud",
        description: "Cari & download lagu SoundCloud gratis (MP3)",
        icon: <Image src="/logo-soundcloud.webp" alt="SoundCloud" width={56} height={56} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/dramabox",
        label: "DramaBox",
        description: "Stream DramaBox dan tonton drama china trending",
        icon: <Image src="/logo-dramabox.webp" alt="DramaBox" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/freereels",
        label: "FreeReels",
        description: "Nonton drama gratis Sub Indo HD — tanpa aplikasi",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 sm:h-12 sm:w-12 text-foreground">
                <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
                <line x1="7" x2="7" y1="2" y2="22" />
                <line x1="17" x2="17" y1="2" y2="22" />
                <line x1="2" x2="22" y1="12" y2="12" />
                <line x1="2" x2="7" y1="7" y2="7" />
                <line x1="2" x2="7" y1="17" y2="17" />
                <line x1="17" x2="22" y1="7" y2="7" />
                <line x1="17" x2="22" y1="17" y2="17" />
            </svg>
        ),
    },
    {
        href: "/reelshort",
        label: "ReelShort",
        description: "Nonton drama pendek viral gratis — langsung dari browser",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 sm:h-12 sm:w-12 text-red-500">
                <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
                <line x1="7" x2="7" y1="2" y2="22" />
                <line x1="17" x2="17" y1="2" y2="22" />
                <line x1="2" x2="22" y1="12" y2="12" />
            </svg>
        ),
    },
];

const tools = [
    {
        href: "/search/freefire",
        label: "Free Fire Check",
        description: "Cek detail akun FF — nickname, rank, guild",
        icon: <Image src="/logo-freefire.webp" alt="Free Fire" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/tokopedia",
        label: "Tokopedia Search",
        description: "Cari produk, bandingkan harga & toko dari Tokopedia",
        icon: <Image src="/logo-tokped.webp" alt="Tokopedia" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
    },
    {
        href: "/search/github",
        label: "GitHub Search",
        description: "Cari profil GitHub, repository, dan statistik user",
        icon: <Image src="/logo-github.webp" alt="GitHub" width={56} height={56} className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />,
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

export default function SearchPage() {
    return (
        <LazyMotion features={domAnimation}>
            <div className="mx-auto max-w-5xl px-4 py-8 font-sans min-h-screen">
                {/* Header */}
                <m.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-left"
                >
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
                        Platform & Tools
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Pilih layanan yang ingin kamu gunakan
                    </p>
                </m.div>

                {/* Section: Social Media */}
                <div className="mb-12">
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-5 flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Search className="w-4 h-4 text-foreground" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground sm:text-xl">
                            Social Media Search
                        </h2>
                    </m.div>

                    <m.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {searchPlatforms.map((p) => (
                            <m.div key={p.href} variants={item}>
                                <Link href={p.href} className="block h-full">
                                    <Card className="h-full cursor-pointer transition-all duration-300 border-border hover:border-muted-foreground/30 hover:shadow-md bg-card group">
                                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 sm:w-14 sm:h-14">
                                                {p.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-bold text-foreground text-base sm:text-lg truncate">{p.label}</h3>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {p.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </m.div>
                        ))}
                    </m.div>
                </div>

                {/* Section: Tools & Utilities */}
                <div>
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-5 flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-foreground" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground sm:text-xl">
                            Tools & Utilities
                        </h2>
                    </m.div>

                    <m.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {tools.map((p) => (
                            <m.div key={p.href} variants={item}>
                                <Link href={p.href} className="block h-full">
                                    <Card className="h-full cursor-pointer transition-all duration-300 border-border hover:border-muted-foreground/30 hover:shadow-md bg-card group">
                                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 sm:w-14 sm:h-14">
                                                {p.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-bold text-foreground text-base sm:text-lg truncate">{p.label}</h3>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {p.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </m.div>
                        ))}
                    </m.div>
                </div>
            </div>
        </LazyMotion>
    );
}
