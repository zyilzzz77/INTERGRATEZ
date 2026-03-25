import { Metadata } from "next";
import { Eye, Database, Lock, Shield, RefreshCw } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return constructMetadata({
        title: `${dict.privacy.title} - Inversave`,
        description: dict.privacy.subtitle,
        url: `/${lang}/privasi`,
        locale: lang === 'id' ? 'id_ID' : 'en_US'
    });
}

export default async function PrivasiPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.privacy;
    const sections = [
        {
            title: text.h1,
            color: "#ffeb3b",
            icon: <Eye className="w-7 h-7" strokeWidth={3} />,
            paragraphs: [text.p1],
            bullets: [
                `${text.li1aStr} ${text.li1a}`,
                `${text.li1bStr} ${text.li1b}`,
                `${text.li1cStr} ${text.li1c}`
            ]
        },
        {
            title: text.h2,
            color: "#a0d1d6",
            icon: <Database className="w-7 h-7" strokeWidth={3} />,
            paragraphs: [text.p2],
            bullets: [text.li2a, text.li2b, text.li2c, text.li2d]
        },
        {
            title: text.h3,
            color: "#c4b5fd",
            icon: <Lock className="w-7 h-7" strokeWidth={3} />,
            paragraphs: [text.p3]
        },
        {
            title: text.h4,
            color: "#ffb3c6",
            icon: <Shield className="w-7 h-7" strokeWidth={3} />,
            paragraphs: [text.p4]
        },
        {
            title: text.h5,
            color: "#ffedc2",
            icon: <RefreshCw className="w-7 h-7" strokeWidth={3} />,
            paragraphs: [text.p5]
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="space-y-3">
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border-[3px] border-black bg-[#a0d1d6] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-neo-sm">
                        Privacy Notice
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight uppercase">{text.title}</h1>
                    <p className="text-black/80 font-bold text-base sm:text-lg leading-relaxed max-w-3xl">
                        {text.subtitle}
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section, idx) => (
                        <section
                            key={idx}
                            className="rounded-2xl border-[3px] border-black bg-white p-6 sm:p-8 shadow-neo-sm relative overflow-hidden transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo"
                        >
                            <div className="absolute -left-5 top-4 h-16 w-16 rounded-2xl border-[3px] border-black opacity-70" style={{ backgroundColor: section.color }} />
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-white shadow-neo-sm" style={{ backgroundColor: section.color }}>
                                        {section.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-neo-sm rotate-1">
                                            Bagian {String(idx + 1).padStart(2, "0")}
                                        </div>
                                        <h2 className="text-2xl font-black text-black leading-tight">{section.title}</h2>
                                    </div>
                                </div>

                                {section.paragraphs?.map((p, i) => (
                                    <p key={i} className="text-base font-bold text-black/80 leading-relaxed">
                                        {p}
                                    </p>
                                ))}

                                {section.bullets && (
                                    <ul className="list-disc pl-6 space-y-2 text-base font-bold text-black/80">
                                        {section.bullets.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border-[3px] border-black bg-[#ffeb3b] px-5 py-4 shadow-neo-sm">
                    <span className="text-sm font-black uppercase tracking-widest text-black">{text.updated}</span>
                    <span className="text-sm font-black text-black bg-white px-3 py-1 rounded-lg border-[3px] border-black shadow-neo-sm">
                        {new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
