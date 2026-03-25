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
    const faqs = [
        {
            title: text.q1,
            answer: text.a1,
            color: "#ffeb3b",
            icon: <HelpCircle className="w-7 h-7" strokeWidth={3} />
        },
        {
            title: text.q2,
            answer: text.a2,
            color: "#ffb3c6",
            icon: <HelpCircle className="w-7 h-7" strokeWidth={3} />
        },
        {
            title: text.q3,
            answer: text.a3,
            color: "#a0d1d6",
            icon: <HelpCircle className="w-7 h-7" strokeWidth={3} />
        },
        {
            title: text.q4,
            answer: text.a4,
            color: "#c4b5fd",
            icon: <HelpCircle className="w-7 h-7" strokeWidth={3} />
        },
        {
            title: text.q5,
            answer: text.a5,
            color: "#ffedc2",
            icon: <HelpCircle className="w-7 h-7" strokeWidth={3} />
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="flex flex-col gap-3">
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border-[3px] border-black bg-[#ffeb3b] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-neo-sm">
                        Help & FAQ
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight uppercase">{text.title}</h1>
                    <p className="text-black/80 font-bold text-base sm:text-lg leading-relaxed">
                        Butuh jawaban cepat? Semua pertanyaan umum kami rangkum di sini dalam gaya tegas dan jelas.
                    </p>
                </div>

                <div className="grid gap-6">
                    {faqs.map((faq, idx) => (
                        <section
                            key={idx}
                            className="relative overflow-hidden rounded-2xl border-[3px] border-black bg-white p-6 sm:p-8 shadow-neo-sm transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo"
                        >
                            <div className="absolute -left-6 top-6 h-16 w-16 rounded-2xl border-[3px] border-black opacity-70" style={{ backgroundColor: faq.color }} />
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-white shadow-neo-sm" style={{ backgroundColor: faq.color }}>
                                    {faq.icon}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center rounded-md bg-black text-white text-xs font-black px-2 py-1 border-2 border-black shadow-neo-sm rotate-2">{String(idx + 1).padStart(2, "0")}</span>
                                        <h2 className="text-2xl font-black text-black leading-tight">{faq.title}</h2>
                                    </div>
                                    <p className="text-base font-bold text-black/80 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <section className="rounded-3xl border-[3px] border-black bg-[#a0d1d6] p-8 shadow-neo relative overflow-hidden">
                    <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full border-[3px] border-black bg-white/70" />
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-neo-sm">
                                <MessageCircle className="w-4 h-4" strokeWidth={3} />
                                {text.needHelp}
                            </div>
                            <p className="text-black font-bold text-base leading-relaxed max-w-2xl">
                                {text.csSubtitle}
                            </p>
                        </div>
                        <a
                            href="https://wa.me/6289525129168"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-black px-5 py-3 text-white font-black uppercase tracking-wide shadow-neo-sm transition-all duration-300 hover:bg-white hover:text-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo"
                        >
                            <MessageCircle className="w-5 h-5" strokeWidth={3} />
                            {text.btnCs}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
