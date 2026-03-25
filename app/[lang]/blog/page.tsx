import { Metadata } from "next";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.blog.title} ${dict.blog.titleHighlight} - Inversave`,
        description: dict.blog.subtitle,
        url: `/${lang}/blog`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.blog;

    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl min-h-screen">
            <h1 className="text-4xl md:text-6xl font-black text-black mb-4 tracking-tight uppercase">
                {text.title} <span className="bg-primary px-2 border-[3px] border-black -rotate-2 inline-block rounded-lg shadow-neo-sm">{text.titleHighlight}</span>
            </h1>
            <p className="text-black/80 font-bold text-lg mb-12">{text.subtitle}</p>

            <div className="space-y-8">
                {/* Blog Post 1 */}
                <article className="bg-[#a0d1d6] border-[3px] border-black rounded-2xl p-6 md:p-8 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all shadow-neo-sm group">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-black font-bold mb-4">
                        <span className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1 rounded-xl">
                            <Tag className="w-4 h-4" />
                            {text.tagFeature}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/50 border-2 border-transparent px-2 py-1 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            1 Maret 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-black text-black mb-3">
                        Peluncuran Fitur Unlimited Streaming untuk Pengguna VIP
                    </h2>

                    <p className="text-black/80 font-medium leading-relaxed mb-6">
                        Kami sangat senang mengumumkan bahwa seluruh pengguna yang berlangganan paket VIP dan VIP-Max kini dapat menikmati akses tontonan gratis tanpa batas untuk seluruh katalog video DramaBox, Netshort, Melolo, dan DramaWave. Streaming tidak lagi memotong limit kredit reguler Anda!
                    </p>

                    <a href={`/${lang}/topup`} className="inline-flex items-center gap-2 text-black font-black hover:translate-x-2 transition-transform bg-white border-[3px] border-black px-4 py-2 rounded-xl">
                        {text.readMore}
                        <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </a>
                </article>

                {/* Blog Post 2 */}
                <article className="bg-[#ffeb3b] border-[3px] border-black rounded-2xl p-6 md:p-8 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all shadow-neo-sm group">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-black font-bold mb-4">
                        <span className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1 rounded-xl">
                            <Tag className="w-4 h-4" />
                            {text.tagPlatform}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/50 border-2 border-transparent px-2 py-1 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            15 Februari 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-black text-black mb-3">
                        Percepatan Kecepatan Unduh TikTok & Video Full HD
                    </h2>

                    <p className="text-black/80 font-medium leading-relaxed mb-6">
                        Tim optimasi kami telah meningkatkan kapasitas server API untuk pemrosesan video TikTok tanpa watermark. Kini ekstraksi video TikTok dapat dilakukan rata-rata di bawah 1,5 detik dengan kualitas sumber full HD.
                    </p>

                    <a href={`/${lang}/search/tiktok`} className="inline-flex items-center gap-2 text-black font-black hover:translate-x-2 transition-transform bg-white border-[3px] border-black px-4 py-2 rounded-xl">
                        {text.tryNow}
                        <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </a>
                </article>

                {/* Blog Post 3 */}
                <article className="bg-[#ffb3c6] border-[3px] border-black rounded-2xl p-6 md:p-8 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all shadow-neo-sm group">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-black font-bold mb-4">
                        <span className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1 rounded-xl">
                            <Tag className="w-4 h-4" />
                            {text.tagAnnounce}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/50 border-2 border-transparent px-2 py-1 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            1 Januari 2026
                        </span>
                    </div>

                    <h2 className="text-2xl font-black text-black mb-3">
                        Selamat Datang di Inversave V5.5 Penuh Fitur Baru
                    </h2>

                    <p className="text-black/80 font-medium leading-relaxed mb-6">
                        Tahun baru, rupa baru. Inversave merilis versi kedua aplikasinya yang dibangun menggunakan ekosistem Next.js modern, mendukung pencarian lintas platform yang lebih mulus dan dasbor top-up intuitif.
                    </p>
                </article>
            </div>

            <div className="mt-12 text-center">
                <button className="bg-white border-[3px] border-black text-black font-black py-3 px-8 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all">
                    {text.loadMore}
                </button>
            </div>
        </div>
    );
}
