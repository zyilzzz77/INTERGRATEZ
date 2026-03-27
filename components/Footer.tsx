import Link from "next/link";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export default function Footer({ dict, lang }: { dict: any; lang: string }) {
    return (
        <footer className="bg-[#e8e6d7] text-black py-12 border-t-[3px] border-black mt-20 w-full relative overflow-hidden rounded-[36px] md:rounded-[56px] before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-[#e8e6d7] z-10">
            <div className="container mx-auto px-4 max-w-7xl relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Column 1: Brand Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href={`/${lang}`} className="inline-block">
                            <span className="text-3xl font-black text-black tracking-tighter hover:text-primary transition-colors">{dict.brandColumnBrand || "inversave.co"}</span>
                        </Link>
                        <p className="text-sm text-gray-700 font-medium max-w-xs mt-4 leading-relaxed">
                            {dict.description || "The most complete and fastest downloader platform with a fun twist."}
                        </p>

                        <div className="space-y-3 mt-6">
                            <div className="flex items-center gap-3 text-sm font-bold hover:text-primary transition-colors cursor-pointer">
                                <Phone className="w-5 h-5 text-black" />
                                <a href="https://wa.me/6289525129168" target="_blank" rel="noopener noreferrer">
                                    {dict.brandColumnCallCenter || "Call Center"}: 089525129168
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold hover:text-primary transition-colors cursor-pointer">
                                <Mail className="w-5 h-5 text-black" />
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
                                className="w-12 h-12 rounded-xl border-[3px] border-black bg-[#ffb3c6] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 shadow-neo-sm hover:shadow-neo transition-all duration-200"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-6 h-6 text-black" />
                            </a>
                            <a
                                href="https://wa.me/6289525129168"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 rounded-xl border-[3px] border-black bg-[#a0d1d6] flex items-center justify-center hover:-translate-y-1 hover:-translate-x-1 shadow-neo-sm hover:shadow-neo transition-all duration-200"
                                aria-label="WhatsApp"
                            >
                                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Produk */}
                    <div className="space-y-4">
                        <h3 className="text-black font-black text-xl tracking-wide mb-6">{dict.products || "Products"}</h3>
                        <ul className="space-y-3 font-bold text-gray-700">
                            <li><Link href={`/${lang}/search/tiktok`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">TikTok Downloader</Link></li>
                            <li><Link href={`/${lang}/search/instagram`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">IG Downloader</Link></li>
                            <li><Link href={`/${lang}/search/youtube`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">YT Downloader</Link></li>
                            <li><Link href={`/${lang}/dramabox`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">DramaBox Streaming</Link></li>
                            <li><Link href={`/${lang}/melolo`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">Melolo Streaming</Link></li>
                            <li><Link href={`/${lang}/netshort`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">Netshort Streaming</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Perusahaan */}
                    <div className="space-y-4">
                        <h3 className="text-black font-black text-xl tracking-wide mb-6">{dict.company || "Company"}</h3>
                        <ul className="space-y-3 font-bold text-gray-700">
                            <li><Link href={`/${lang}/about`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.aboutUs || "About Us"}</Link></li>
                            <li><Link href={`/${lang}/blog`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.blog || "Blog & Update"}</Link></li>
                            <li><Link href={`/${lang}/topup`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.pricing || "Harga & Paket"}</Link></li>
                            <li><Link href={`/${lang}/docs`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.apiDocs || "API Documentation"}</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Lainnya & Hubungi Kami */}
                    <div className="space-y-4">
                        <h3 className="text-black font-black text-xl tracking-wide mb-6">{dict.others || "Others"}</h3>
                        <ul className="space-y-3 font-bold text-gray-700">
                            <li><Link href={`/${lang}/bantuan`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.faq || "Bantuan FAQ"}</Link></li>
                            <li><Link href={`/${lang}/privasi`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.privacy || "Pemberitahuan Privasi"}</Link></li>
                            <li><Link href={`/${lang}/syarat`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.terms || "Syarat & Ketentuan"}</Link></li>
                            <li><Link href={`/${lang}/disclaimer`} className="hover:text-white focus:text-white active:text-white visited:text-black hover:underline hover:-translate-y-0.5 inline-block transition-transform">{dict.disclaimer || "Disclaimer DMCA"}</Link></li>
                        </ul>

                        <div className="pt-6">
                            <h3 className="text-black font-black text-xl tracking-wide mb-4">{dict.contactUs || "Contact Us"}</h3>
                            <div className="flex gap-2 text-sm font-bold text-gray-700">
                                <MapPin className="w-5 h-5 shrink-0 text-black mt-1" />
                                <span className="leading-snug">
                                    Jakarta, Indonesia<br />
                                    Kode Pos 12160
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t-[3px] border-black pt-8 mt-8 pb-4">
                    <p className="text-sm font-bold text-gray-700 text-center leading-relaxed mx-auto">
                        {dict.disclaimerText || "Inversave is an independent downloader platform..."}
                    </p>
                    <p className="text-base font-black text-black text-center mt-4">
                        © {new Date().getFullYear()} Inversave. Made with zyilzz. {dict.rightsReserved || "All Rights Reserved."}
                    </p>
                </div>
            </div>
        </footer>
    );
}
