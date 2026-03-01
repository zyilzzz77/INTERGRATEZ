import Link from "next/link";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export default function Footer({ dict, lang }: { dict: any; lang: string }) {
    return (
        <footer className="bg-[#111827] text-gray-300 py-12 border-t border-gray-800">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Column 1: Brand Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href={`/${lang}`} className="inline-block">
                            <span className="text-3xl font-black text-white tracking-tighter">{dict.brandColumnBrand || "Inversave"}</span>
                        </Link>
                        <p className="text-sm text-gray-400 max-w-xs mt-4 leading-relaxed">
                            {dict.description || "The most complete and fastest downloader..."}
                        </p>

                        <div className="space-y-3 mt-6">
                            <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                                <Phone className="w-4 h-4 text-emerald-500" />
                                <a href="https://wa.me/6289525129168" target="_blank" rel="noopener noreferrer">
                                    {dict.brandColumnCallCenter || "Call Center"}: 089525129168
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                                <Mail className="w-4 h-4 text-blue-400" />
                                <a href="mailto:zyilzyyz@gmail.com">
                                    cs@inversave.space
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4">
                            <a
                                href="https://instagram.com/zyilzzz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://wa.me/6289525129168"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300"
                                aria-label="WhatsApp"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Produk */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg tracking-wide mb-6">{dict.products || "Products"}</h3>
                        <ul className="space-y-3">
                            <li><Link href={`/${lang}/search/tiktok`} className="hover:text-white transition-colors">TikTok Downloader</Link></li>
                            <li><Link href={`/${lang}/search/instagram`} className="hover:text-white transition-colors">IG Downloader</Link></li>
                            <li><Link href={`/${lang}/search/youtube`} className="hover:text-white transition-colors">YT Downloader</Link></li>
                            <li><Link href={`/${lang}/dramabox`} className="hover:text-white transition-colors">DramaBox Streaming</Link></li>
                            <li><Link href={`/${lang}/melolo`} className="hover:text-white transition-colors">Melolo Streaming</Link></li>
                            <li><Link href={`/${lang}/netshort`} className="hover:text-white transition-colors">Netshort Streaming</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Perusahaan */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg tracking-wide mb-6">{dict.company || "Company"}</h3>
                        <ul className="space-y-3">
                            <li><Link href={`/${lang}/about`} className="hover:text-white transition-colors">{dict.aboutUs || "About Us"}</Link></li>
                            <li><Link href={`/${lang}/blog`} className="hover:text-white transition-colors">{dict.blog || "Blog & Update"}</Link></li>
                            <li><Link href={`/${lang}/topup`} className="hover:text-white transition-colors">{dict.pricing || "Harga & Paket"}</Link></li>
                            <li><Link href={`/${lang}/docs`} className="hover:text-white transition-colors">{dict.apiDocs || "API Documentation"}</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Lainnya & Hubungi Kami */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg tracking-wide mb-6">{dict.others || "Others"}</h3>
                        <ul className="space-y-3">
                            <li><Link href={`/${lang}/bantuan`} className="hover:text-white transition-colors">{dict.faq || "Bantuan FAQ"}</Link></li>
                            <li><Link href={`/${lang}/privasi`} className="hover:text-white transition-colors">{dict.privacy || "Pemberitahuan Privasi"}</Link></li>
                            <li><Link href={`/${lang}/syarat`} className="hover:text-white transition-colors">{dict.terms || "Syarat & Ketentuan"}</Link></li>
                            <li><Link href={`/${lang}/disclaimer`} className="hover:text-white transition-colors">{dict.disclaimer || "Disclaimer DMCA"}</Link></li>
                        </ul>

                        <div className="pt-6">
                            <h3 className="text-white font-bold text-lg tracking-wide mb-4">{dict.contactUs || "Contact Us"}</h3>
                            <div className="flex gap-2 text-sm max-w-[200px]">
                                <MapPin className="w-5 h-5 shrink-0 text-gray-500 mt-1" />
                                <span className="text-gray-400 leading-snug">
                                    Jakarta, Indonesia<br />
                                    Kode Pos 12160
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 mt-8">
                    <p className="text-xs text-gray-500 text-center leading-relaxed max-w-4xl mx-auto">
                        {dict.disclaimerText || "Inversave is an independent downloader platform..."}
                    </p>
                    <p className="text-sm font-semibold text-gray-400 text-center mt-6">
                        © {new Date().getFullYear()} Inversave. Made with zyilzz. {dict.rightsReserved || "All Rights Reserved."}
                    </p>
                </div>
            </div>
        </footer>
    );
}
