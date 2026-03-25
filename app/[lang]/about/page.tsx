import { Metadata } from "next";
import { Coffee, Shield, Zap, Heart } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.about.title} - ${dict.about.brand}`,
        description: dict.about.subtitle,
        url: `/${lang}/about`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.about;

    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl min-h-screen">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tight uppercase">
                    {text.title} <span className="bg-primary px-2 border-[3px] border-black rotate-2 inline-block rounded-lg shadow-neo-sm">{text.brand}</span>
                </h1>
                <p className="text-lg md:text-xl text-black/80 font-bold max-w-2xl mx-auto leading-relaxed">
                    {text.subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
                <div className="space-y-6 text-black">
                    <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">{text.missionTitle}</h2>
                    <p className="leading-relaxed font-semibold text-lg text-black/80">
                        {text.missionText1}
                    </p>
                    <p className="leading-relaxed font-semibold text-lg text-black/80">
                        {text.missionText2}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#a0d1d6] border-[3px] border-black p-6 rounded-2xl flex flex-col items-center text-center shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-transform duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h3 className="text-black font-black mb-2 text-lg">{text.feature1Title}</h3>
                        <p className="text-sm font-bold text-black/70">{text.feature1Desc}</p>
                    </div>
                    <div className="bg-[#ffb3c6] border-[3px] border-black p-6 rounded-2xl flex flex-col items-center text-center shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-transform duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h3 className="text-black font-black mb-2 text-lg">{text.feature2Title}</h3>
                        <p className="text-sm font-bold text-black/70">{text.feature2Desc}</p>
                    </div>
                    <div className="bg-[#ffeb3b] border-[3px] border-black p-6 rounded-2xl flex flex-col items-center text-center shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-transform duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-4">
                            <Coffee className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h3 className="text-black font-black mb-2 text-lg">{text.feature3Title}</h3>
                        <p className="text-sm font-bold text-black/70">{text.feature3Desc}</p>
                    </div>
                    <div className="bg-[#c4b5fd] border-[3px] border-black p-6 rounded-2xl flex flex-col items-center text-center shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-transform duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center mb-4">
                            <Heart className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <h3 className="text-black font-black mb-2 text-lg">{text.feature4Title}</h3>
                        <p className="text-sm font-bold text-black/70">{text.feature4Desc}</p>
                    </div>
                </div>
            </div>

            <div className="bg-primary border-[3px] border-black shadow-neo rounded-3xl p-8 md:p-12 text-center mt-12 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-black mb-6 uppercase">{text.ctaTitle}</h2>
                    <p className="text-black/80 font-bold mb-8 max-w-xl mx-auto text-lg">
                        {text.ctaSubtitle}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href={`/${lang}/search`} className="bg-white border-[3px] border-black text-black font-black py-4 px-8 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all text-lg">
                            {text.btnTry}
                        </a>
                        <a href={`/${lang}/topup`} className="bg-secondary border-[3px] border-black text-black font-black py-4 px-8 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all text-lg">
                            {text.btnVip}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
