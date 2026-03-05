import { Metadata } from "next";
import { AlertTriangle, Scale, ShieldAlert, Mail } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.disclaimer.title} - Inversave`,
        description: dict.disclaimer.subtitle,
        url: `/${lang}/disclaimer`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function DisclaimerPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.disclaimer;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
            <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight">{text.title}</h1>

            <div className="prose prose-invert max-w-none text-muted-foreground">
                <p className="lead text-lg mb-8 font-medium">
                    {text.subtitle}
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                    {text.h1}
                </h2>
                <p className="mb-4">
                    {text.p1}
                </p>
                <p className="mb-6 border-l-4 border-red-500 pl-4 py-2 bg-red-500/10 text-red-400">
                    <strong>{text.important}</strong> {text.importantText}
                </p>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <Scale className="w-6 h-6 text-blue-400 shrink-0" />
                    {text.h2}
                </h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>{text.li2a}</li>
                    <li>{text.li2b}</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                    {text.h3}
                </h2>
                <p className="mb-4">
                    {text.p3a}
                </p>
                <p className="mb-6 mb-8">
                    {text.p3b}
                </p>

                <div className="bg-secondary/50 border border-border rounded-xl p-6 mb-8 text-sm font-mono">
                    <p>{text.format}</p>
                    <ul className="list-inside space-y-1 mt-2 text-muted-foreground/70">
                        <li>{text.cli1}</li>
                        <li>{text.cli2}</li>
                        <li>{text.cli3}</li>
                        <li>{text.cli4}</li>
                    </ul>
                </div>

                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center gap-3">
                    <Mail className="w-6 h-6 text-emerald-400 shrink-0" />
                    {text.h4}
                </h2>
                <p className="mb-12">
                    {text.p4}
                    <br />
                    <a href="mailto:zyilzyyz@gmail.com" className="font-bold text-blue-400 hover:text-blue-300 underline mt-2 inline-block">cs@inversave.space</a> {text.or} <a href="mailto:zyilzyyz@gmail.com" className="font-bold text-blue-400 hover:text-blue-300 underline mt-2 inline-block">zyilzyyz@gmail.com</a>.
                </p>
            </div>
        </div>
    );
}
