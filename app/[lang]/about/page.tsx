import { Metadata } from "next";
import { Coffee, Shield, Zap, Heart } from "lucide-react";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: `${dict.about.title} - ${dict.about.brand}`,
        description: dict.about.subtitle,
    };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.about;

    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl min-h-screen">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                    {text.title} <span className="text-emerald-500">{text.brand}</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    {text.subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
                <div className="space-y-6 text-gray-300">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{text.missionTitle}</h2>
                    <p className="leading-relaxed">
                        {text.missionText1}
                    </p>
                    <p className="leading-relaxed">
                        {text.missionText2}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center">
                        <Zap className="w-10 h-10 text-emerald-400 mb-4" />
                        <h3 className="text-white font-bold mb-2">{text.feature1Title}</h3>
                        <p className="text-sm text-gray-400">{text.feature1Desc}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center">
                        <Shield className="w-10 h-10 text-blue-400 mb-4" />
                        <h3 className="text-white font-bold mb-2">{text.feature2Title}</h3>
                        <p className="text-sm text-gray-400">{text.feature2Desc}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center">
                        <Coffee className="w-10 h-10 text-amber-400 mb-4" />
                        <h3 className="text-white font-bold mb-2">{text.feature3Title}</h3>
                        <p className="text-sm text-gray-400">{text.feature3Desc}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center">
                        <Heart className="w-10 h-10 text-pink-400 mb-4" />
                        <h3 className="text-white font-bold mb-2">{text.feature4Title}</h3>
                        <p className="text-sm text-gray-400">{text.feature4Desc}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center mt-12">
                <h2 className="text-3xl font-bold text-white mb-6">{text.ctaTitle}</h2>
                <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                    {text.ctaSubtitle}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a href={`/${lang}/search`} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all">
                        {text.btnTry}
                    </a>
                    <a href={`/${lang}/topup`} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition-all backdrop-blur-sm border border-white/10">
                        {text.btnVip}
                    </a>
                </div>
            </div>
        </div>
    );
}
