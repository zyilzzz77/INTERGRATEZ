import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: `${dict.bantuan.title} - Inversave`,
        description: dict.bantuan.title,
    };
}

export default async function BantuanPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.bantuan;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
            <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">{text.title}</h1>

            <div className="space-y-8 text-gray-300">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{text.q1}</h2>
                    <p className="leading-relaxed">
                        {text.a1}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{text.q2}</h2>
                    <p className="leading-relaxed">
                        {text.a2}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{text.q3}</h2>
                    <p className="leading-relaxed">
                        {text.a3}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{text.q4}</h2>
                    <p className="leading-relaxed">
                        {text.a4}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{text.q5}</h2>
                    <p className="leading-relaxed">
                        {text.a5}
                    </p>
                </section>

                <section className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-12">
                    <h2 className="text-xl font-bold text-white mb-2">{text.needHelp}</h2>
                    <p className="text-sm mb-4">{text.csSubtitle}</p>
                    <a href="https://wa.me/6289525129168" target="_blank" rel="noopener noreferrer" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        {text.btnCs}
                    </a>
                </section>
            </div>
        </div>
    );
}
