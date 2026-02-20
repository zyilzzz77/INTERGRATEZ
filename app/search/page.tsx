"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const searchPlatforms = [
    {
        href: "/search/youtube",
        label: "YouTube",
        description: "Cari video, lihat durasi & views, lalu download MP4/MP3",
        icon: <Image src="/logo-yt.webp" alt="YouTube" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-red-500/20 hover:border-red-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-red-500/10",
    },
    {
        href: "/search/tiktok",
        label: "TikTok",
        description: "Cari video TikTok, lihat stats & download",
        icon: <Image src="/logo-tiktok.webp" alt="TikTok" width={56} height={56} className="h-14 w-14 object-cover" />,
        color: "transparent",
        border: "border-cyan-500/20 hover:border-cyan-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-cyan-500/10",
    },
    {
        href: "/search/instagram",
        label: "Instagram",
        description: "Stalk profil IG — lihat followers, posts & bio",
        icon: <Image src="/logo-instagram.webp" alt="Instagram" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-purple-500/20 hover:border-purple-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-purple-500/10",
    },
    {
        href: "/search/spotify",
        label: "Spotify",
        description: "Cari lagu favorit, preview 30 detik, download audio",
        icon: <Image src="/logo-spotify.webp" alt="Spotify" width={56} height={56} className="h-14 w-14 object-cover" />,
        color: "transparent",
        border: "border-green-500/20 hover:border-green-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-green-500/10",
    },
    {
        href: "/search/pinterest",
        label: "Pinterest",
        description: "Cari foto & gambar inspirasi, download HD",
        icon: <Image src="/logo-pinterest.webp" alt="Pinterest" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-pink-500/20 hover:border-pink-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-pink-500/10",
    },
    {
        href: "/search/bilibili",
        label: "Bilibili",
        description: "Cari video Bilibili, lihat durasi & views",
        icon: <Image src="/logo-bilibili.webp" alt="Bilibili" width={56} height={56} className="h-14 w-14 object-cover" />,
        color: "transparent",
        border: "border-sky-500/20 hover:border-sky-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-sky-500/10",
    },
    {
        href: "/search/applemusic",
        label: "Apple Music",
        description: "Download lagu & album dari Apple Music kualitas tinggi",
        icon: <Image src="/logo-apple-music.webp" alt="Apple Music" width={56} height={56} className="h-14 w-14 object-cover" />,
        color: "transparent",
        border: "border-red-500/20 hover:border-red-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-red-500/10",
    },
    {
        href: "/search/soundcloud",
        label: "SoundCloud",
        description: "Cari & download lagu SoundCloud gratis (MP3)",
        icon: <Image src="/logo-soundcloud.webp" alt="SoundCloud" width={56} height={56} className="h-14 w-14 object-cover" />,
        color: "transparent",
        border: "border-orange-500/20 hover:border-orange-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-orange-500/10",
    },
];

const tools = [
    {
        href: "/search/freefire",
        label: "Free Fire Check",
        description: "Cek detail akun FF — nickname, rank, guild",
        icon: <Image src="/logo-freefire.webp" alt="Free Fire" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-orange-500/20 hover:border-orange-500/40",
        textColor: "text-orange-400",
        shadow: "hover:shadow-orange-500/10",
    },
    {
        href: "/search/tokopedia",
        label: "Tokopedia Search",
        description: "Cari produk, bandingkan harga & toko dari Tokopedia",
        icon: <Image src="/logo-tokped.webp" alt="Tokopedia" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-green-500/20 hover:border-green-500/40",
        textColor: "text-white",
        shadow: "hover:shadow-green-500/10",
    },
    {
        href: "/search/github",
        label: "GitHub Search",
        description: "Cari profil GitHub, repository, dan statistik user",
        icon: <Image src="/logo-github.webp" alt="GitHub" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />,
        color: "transparent",
        border: "border-white/20 hover:border-white/40",
        textColor: "text-white",
        shadow: "hover:shadow-white/10",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function SearchPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-14">
            {/* Header Utama */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12 text-center"
            >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg ring-1 ring-white/20">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black text-neutral-200 sm:text-4xl">
                    Platform & Tools
                </h1>
                <p className="mt-3 text-base text-neutral-400">
                    Pilih layanan yang ingin kamu gunakan
                </p>
            </motion.div>

            {/* Bagian 1: Search Platforms */}
            <div className="mb-16">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 flex items-center gap-3"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg">
                        🌏
                    </span>
                    <h2 className="text-xl font-bold text-neutral-200">
                        Social Media Search
                    </h2>
                </motion.div>
                
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {searchPlatforms.map((p) => (
                        <motion.div key={p.href} variants={item}>
                            <Link
                                href={p.href}
                                className={`group flex h-full flex-col items-center gap-3 rounded-2xl border ${p.border} bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${p.shadow}`}
                            >
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${p.color === "transparent" ? "" : `bg-gradient-to-br ${p.color} shadow-md`} text-white transition-transform duration-300 group-hover:scale-110`}>
                                    {p.icon}
                                </div>
                                <h2 className={`text-lg font-bold ${p.textColor}`}>
                                    {p.label}
                                </h2>
                                <p className="text-xs leading-relaxed text-neutral-500">
                                    {p.description}
                                </p>
                                <span className={`mt-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ${p.textColor} transition-colors`}>
                                    Cari Sekarang
                                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Bagian 2: Tools */}
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 flex items-center gap-3"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg">
                        🛠️
                    </span>
                    <h2 className="text-xl font-bold text-neutral-200">
                        Tools & Utilities
                    </h2>
                </motion.div>

                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {tools.map((p) => (
                        <motion.div key={p.href} variants={item}>
                            <Link
                                href={p.href}
                                className={`group flex h-full flex-col items-center gap-3 rounded-2xl border ${p.border} bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${p.shadow}`}
                            >
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${p.color === "transparent" ? "" : `bg-gradient-to-br ${p.color} shadow-md`} text-white transition-transform duration-300 group-hover:scale-110`}>
                                    {p.icon}
                                </div>
                                <h2 className={`text-lg font-bold ${p.textColor}`}>
                                    {p.label}
                                </h2>
                                <p className="text-xs leading-relaxed text-neutral-500">
                                    {p.description}
                                </p>
                                <span className={`mt-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ${p.textColor} transition-colors`}>
                                    Gunakan Tools
                                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
