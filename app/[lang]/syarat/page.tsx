import { Metadata } from "next";
import { FileText, BookOpen, Ban, Scale, Info } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.terms.title} - Inversave`,
        description: dict.terms.subtitle,
        url: `/${lang}/syarat`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function SyaratPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.terms;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
            <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">{text.title}</h1>

            <div className="prose prose-invert max-w-none text-muted-foreground">
                <p className="lead text-lg mb-8">
                    {text.subtitle}
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                    {text.h1}
                </h2>
                <p className="mb-6">
                    {text.p1}
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-purple-400 shrink-0" />
                    {text.h2}
                </h2>
                <p>{text.p2}</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>{text.li2a}</li>
                    <li>{text.li2b}</li>
                    <li>{text.li2c}</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <Ban className="w-6 h-6 text-rose-400 shrink-0" />
                    {text.h3}
                </h2>
                <p className="mb-6">
                    {text.p3}
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <Scale className="w-6 h-6 text-amber-400 shrink-0" />
                    {text.h4}
                </h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>{text.li4a}</li>
                    <li>{text.li4b}</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <Info className="w-6 h-6 text-cyan-400 shrink-0" />
                    {text.h5}
                </h2>
                <p className="mb-6">
                    {text.p5}
                </p>

                <p className="text-sm border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/10 italic text-yellow-200 mt-12 mb-8">
                    {text.note}
                </p>

                <hr className="border-border my-8" />
                <p className="text-sm text-muted-foreground/60">
                    {text.effective} {new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
