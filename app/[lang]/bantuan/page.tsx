import { Metadata } from "next";
import { HelpCircle, MessageCircle } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.bantuan.title} - Inversave`,
        description: dict.bantuan.title,
        url: `/${lang}/bantuan`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function BantuanPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.bantuan;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
            <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">{text.title}</h1>

            <div className="space-y-8 text-muted-foreground">
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-blue-400 shrink-0" />
                        {text.q1}
                    </h2>
                    <p className="leading-relaxed">
                        {text.a1}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-purple-400 shrink-0" />
                        {text.q2}
                    </h2>
                    <p className="leading-relaxed">
                        {text.a2}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                        {text.q3}
                    </h2>
                    <p className="leading-relaxed">
                        {text.a3}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-amber-400 shrink-0" />
                        {text.q4}
                    </h2>
                    <p className="leading-relaxed">
                        {text.a4}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-cyan-400 shrink-0" />
                        {text.q5}
                    </h2>
                    <p className="leading-relaxed">
                        {text.a5}
                    </p>
                </section>

                <section className="bg-secondary/50 p-6 rounded-2xl border border-border mt-12">
                    <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        {text.needHelp}
                    </h2>
                    <p className="text-sm mb-4">{text.csSubtitle}</p>
                    <a href="https://wa.me/6289525129168" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        {text.btnCs}
                    </a>
                </section>
            </div>
        </div>
    );
}
