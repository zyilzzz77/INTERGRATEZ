import { Metadata } from "next";
import { ArrowRight, Calendar, Tag } from "lucide-react";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: `${dict.blog.title} ${dict.blog.titleHighlight} - Inversave`,
        description: dict.blog.subtitle,
    };
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.blog;

    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl min-h-screen">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{text.title}<span className="text-blue-500">{text.titleHighlight}</span></h1>
            <p className="text-gray-400 text-lg mb-12">{text.subtitle}</p>

            <div className="space-y-8">
                {/* Blog Post 1 */}
                <article className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-colors group">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            {text.tagFeature}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            1 Maret 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        Peluncuran Fitur Unlimited Streaming untuk Pengguna VIP
                    </h2>

                    <p className="text-gray-300 leading-relaxed mb-6">
                        Kami sangat senang mengumumkan bahwa seluruh pengguna yang berlangganan paket VIP dan VIP-Max kini dapat menikmati akses tontonan gratis tanpa batas untuk seluruh katalog video DramaBox, Netshort, Melolo, dan DramaWave. Streaming tidak lagi memotong limit kredit reguler Anda!
                    </p>

                    <a href={`/${lang}/topup`} className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                        {text.readMore}
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </article>

                {/* Blog Post 2 */}
                <article className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-colors group">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            {text.tagPlatform}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            15 Februari 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        Percepatan Kecepatan Unduh TikTok & Video Full HD
                    </h2>

                    <p className="text-gray-300 leading-relaxed mb-6">
                        Tim optimasi kami telah meningkatkan kapasitas server API untuk pemrosesan video TikTok tanpa watermark. Kini ekstraksi video TikTok dapat dilakukan rata-rata di bawah 1,5 detik dengan kualitas sumber full HD.
                    </p>

                    <a href={`/${lang}/search/tiktok`} className="inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                        {text.tryNow}
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </article>

                {/* Blog Post 3 */}
                <article className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-colors group opacity-80">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            {text.tagAnnounce}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            1 Januari 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                        Selamat Datang di Inversave V2.0 Penuh Fitur Baru
                    </h2>

                    <p className="text-gray-300 leading-relaxed mb-6">
                        Tahun baru, rupa baru. Inversave merilis versi kedua aplikasinya yang dibangun menggunakan ekosistem Next.js modern, mendukung pencarian lintas platform yang lebih mulus dan dasbor top-up intuitif.
                    </p>
                </article>
            </div>

            <div className="mt-12 text-center">
                <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-full transition-colors border border-white/10 text-sm">
                    {text.loadMore}
                </button>
            </div>
        </div>
    );
}
