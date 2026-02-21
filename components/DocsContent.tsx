"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

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

export default function DocsContent() {
    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-neutral-900 px-4 py-12 text-neutral-200">
                <m.div 
                    className="mx-auto max-w-4xl"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {/* Header */}
                    <m.div variants={item} className="mb-12 text-center">
                        <h1 className="text-4xl font-black text-white md:text-5xl">
                            📖 Dokumentasi
                        </h1>
                        <p className="mt-4 text-lg text-neutral-400">
                            Panduan cara menggunakan semua fitur downloader & search engine.
                        </p>
                    </m.div>

                    {/* Navigation */}
                    <m.div variants={item} className="mb-12 flex flex-wrap justify-center gap-3">
                        <a href="#downloader" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            ⬇️ Downloader
                        </a>
                        <a href="#search" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            🔍 Search Engine
                        </a>
                        <a href="#stalker" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            👤 Stalker
                        </a>
                        <a href="#tools" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            🧰 Tools
                        </a>
                    </m.div>

                    <div className="space-y-12">
                        {/* SECTION: DOWNLOADER */}
                        <m.section variants={item} id="downloader" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-2xl">⬇️</span>
                                <h2 className="text-2xl font-bold text-white">Social Media Downloader</h2>
                            </div>

                            <div className="space-y-8">
                                <DocItem
                                    title="YouTube Downloader"
                                    desc="Download video YouTube (MP4) atau audio (MP3) dengan kualitas tinggi hingga 4K."
                                    steps={[
                                        "Salin link video YouTube yang ingin di-download.",
                                        "Tempel link ke kolom input di halaman utama.",
                                        "Klik tombol 'Download'.",
                                        "Pilih format & kualitas yang diinginkan (misal: 1080p, MP3)."
                                    ]}
                                    example="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                />

                                <DocItem
                                    title="TikTok Downloader"
                                    desc="Download video TikTok tanpa watermark atau slide foto (jika postingan berupa gambar)."
                                    steps={[
                                        "Buka video TikTok, klik Share -> Salin Tautan.",
                                        "Tempel link di halaman utama.",
                                        "Klik tombol 'Download'.",
                                        "Pilih 'No Watermark' untuk video bersih atau download audio saja."
                                    ]}
                                    example="https://www.tiktok.com/@tiktok/video/7296366226223336710"
                                />

                                <DocItem
                                    title="Instagram Downloader"
                                    desc="Download Reels, Video, Foto, atau Carousel dari Instagram."
                                    steps={[
                                        "Buka postingan Instagram, klik titik tiga -> Link / Salin Tautan.",
                                        "Tempel link di halaman utama.",
                                        "Klik tombol 'Download'.",
                                        "Semua media dalam postingan akan muncul dan bisa di-download satu per satu."
                                    ]}
                                    example="https://www.instagram.com/p/Cynj2rOy_z_/"
                                />

                                <DocItem
                                    title="Facebook Downloader"
                                    desc="Download video publik dari Facebook (HD/SD)."
                                    steps={[
                                        "Salin link video Facebook.",
                                        "Tempel di halaman utama dan klik 'Download'.",
                                        "Pilih kualitas HD atau SD."
                                    ]}
                                    example="https://www.facebook.com/watch/?v=123456789"
                                />

                                <DocItem
                                    title="Lainnya"
                                    desc="Mendukung juga: Pinterest, Spotify, SoundCloud, Bilibili, CapCut, Threads, Twitter (X), Terabox, Mediafire, dll."
                                    steps={[
                                        "Caranya sama: Cukup salin link dari platform tersebut.",
                                        "Tempel di halaman utama.",
                                        "Sistem akan otomatis mendeteksi platform dan menampilkan hasil."
                                    ]}
                                />
                            </div>
                        </m.section>

                        {/* SECTION: SEARCH ENGINE */}
                        <m.section variants={item} id="search" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-2xl">🔍</span>
                                <h2 className="text-2xl font-bold text-white">Social Search Engine</h2>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <SearchItem
                                    icon="▶️"
                                    title="YouTube Search"
                                    url="/search/youtube"
                                    desc="Cari video YouTube, tonton langsung, atau download."
                                    query="Jalan-jalan ke Jepang"
                                />
                                <SearchItem
                                    icon="🎵"
                                    title="Spotify Search"
                                    url="/search/spotify"
                                    desc="Cari lagu di Spotify, dengarkan preview, dan download MP3."
                                    query="Mahalini Sial"
                                />
                                <SearchItem
                                    icon="📸"
                                    title="Instagram Search"
                                    url="/search/instagram"
                                    desc="Cari profil Instagram dan lihat ringkasan info."
                                    query="najwashihab"
                                />
                                <SearchItem
                                    icon="🎬"
                                    title="TikTok Search"
                                    url="/search/tiktok"
                                    desc="Cari video atau slide foto TikTok berdasarkan kata kunci."
                                    query="Resep masakan simple"
                                />
                                <SearchItem
                                    icon="📌"
                                    title="Pinterest Search"
                                    url="/search/pinterest"
                                    desc="Cari inspirasi gambar dan ide dari Pinterest."
                                    query="Aesthetic wallpaper"
                                />
                                <SearchItem
                                    icon="☁️"
                                    title="SoundCloud Search"
                                    url="/search/soundcloud"
                                    desc="Cari musik indie dan cover lagu di SoundCloud."
                                    query="Lo-fi beats"
                                />
                                <SearchItem
                                    icon="📺"
                                    title="Bilibili Search"
                                    url="/search/bilibili"
                                    desc="Cari anime atau video kreatif dari Bilibili (Bstation)."
                                    query="Naruto sub indo"
                                />
                                <SearchItem
                                    icon="🍎"
                                    title="Apple Music Search"
                                    url="/search/applemusic"
                                    desc="Cari lagu dari katalog Apple Music."
                                    query="Taylor Swift"
                                />
                            </div>
                        </m.section>

                        {/* SECTION: TOOLS */}
                        <m.section variants={item} id="tools" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl">🧰</span>
                                <h2 className="text-2xl font-bold text-white">Tools Tambahan</h2>
                            </div>

                            <div className="space-y-6">
                                <DocItem
                                    title="Free Fire Check"
                                    desc="Cek detail akun Free Fire berdasarkan UID."
                                    steps={[
                                        "Masuk ke menu Search -> Free Fire.",
                                        "Masukkan UID akun.",
                                        "Klik Search untuk melihat detail akun."
                                    ]}
                                    example="123456789"
                                />

                                <DocItem
                                    title="Tokopedia Search"
                                    desc="Cari produk dan bandingkan harga dari Tokopedia."
                                    steps={[
                                        "Masuk ke menu Search -> Tokopedia.",
                                        "Masukkan nama produk.",
                                        "Klik Search untuk melihat hasil dan harga."
                                    ]}
                                    example="iPhone 15"
                                />

                                <DocItem
                                    title="GitHub Search"
                                    desc="Cari profil developer di GitHub."
                                    steps={[
                                        "Masuk ke menu Search -> GitHub.",
                                        "Masukkan username GitHub.",
                                        "Lihat repository, gists, dan info profil."
                                    ]}
                                    example="vercel"
                                />
                            </div>
                        </m.section>

                        {/* SECTION: STALKER */}
                        <m.section variants={item} id="stalker" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 text-2xl">👤</span>
                                <h2 className="text-2xl font-bold text-white">Stalker Tools</h2>
                            </div>

                            <div className="space-y-6">
                                <DocItem
                                    title="Instagram Stalker"
                                    desc="Lihat profil Instagram secara anonim (Followers, Bio, Posts)."
                                    steps={[
                                        "Masuk ke menu Search -> Instagram.",
                                        "Masukkan username Instagram (tanpa @).",
                                        "Klik Search untuk melihat detail profil."
                                    ]}
                                    example="jokowi"
                                />
                                
                                <DocItem
                                    title="TikTok Stalker"
                                    desc="Analisis profil TikTok seseorang."
                                    steps={[
                                        "Masuk ke menu Search -> TikTok.",
                                        "Pilih mode 'Stalk'.",
                                        "Masukkan username TikTok.",
                                        "Lihat statistik followers, likes, dan video."
                                    ]}
                                    example="sandys.ss"
                                />
                            </div>
                        </m.section>
                    </div>

                    <m.div variants={item} className="mt-12 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
                        >
                            🏠 Kembali ke Beranda
                        </Link>
                    </m.div>
                </m.div>
            </div>
        </LazyMotion>
    );
}

function DocItem({ title, desc, steps, example }: { title: string, desc: string, steps: string[], example?: string }) {
    return (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5 transition hover:bg-black/30">
            <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
            <p className="mb-4 text-sm text-neutral-400">{desc}</p>
            
            <div className="mb-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cara Penggunaan:</p>
                <ol className="list-decimal space-y-1 pl-4 text-sm text-neutral-300">
                    {steps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            </div>

            {example && (
                <div className="rounded-lg bg-black/40 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase text-neutral-500">Contoh Link / Query:</p>
                    <code className="block break-all font-mono text-xs text-green-400">{example}</code>
                </div>
            )}
        </div>
    );
}

function SearchItem({ icon, title, url, desc, query }: { icon: string, title: string, url: string, desc: string, query: string }) {
    return (
        <div className="flex flex-col rounded-xl border border-white/5 bg-black/20 p-5 transition hover:border-white/20 hover:bg-black/30">
            <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <p className="mb-4 flex-1 text-sm text-neutral-400">{desc}</p>
            <div className="mb-4 rounded-lg bg-black/40 p-2">
                <p className="text-[10px] text-neutral-500">Contoh Query:</p>
                <p className="font-mono text-xs text-sky-400">"{query}"</p>
            </div>
            <Link
                href={url}
                className="mt-auto block w-full rounded-lg bg-white/10 py-2 text-center text-xs font-bold text-white transition hover:bg-white/20"
            >
                Coba Sekarang ↗
            </Link>
        </div>
    );
}
