import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionary";

// We can no longer auto-export metadata since it's dynamic
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: `${dict.privacy.title} - Inversave`,
        description: dict.privacy.subtitle,
    };
}

export default async function PrivasiPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const text = dict.privacy;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl min-h-screen">
            <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">{text.title}</h1>

            <div className="prose prose-invert max-w-none text-gray-300">
                <p className="lead text-lg mb-8">
                    {text.subtitle}
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">{text.h1}</h2>
                <p>
                    {text.p1}
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li><strong>{text.li1aStr}</strong> {text.li1a}</li>
                    <li><strong>{text.li1bStr}</strong> {text.li1b}</li>
                    <li><strong>{text.li1cStr}</strong> {text.li1c}</li>
                </ul>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">{text.h2}</h2>
                <p>
                    {text.p2}
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>{text.li2a}</li>
                    <li>{text.li2b}</li>
                    <li>{text.li2c}</li>
                    <li>{text.li2d}</li>
                </ul>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">{text.h3}</h2>
                <p className="mb-6">
                    {text.p3}
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">{text.h4}</h2>
                <p className="mb-6">
                    {text.p4}
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">{text.h5}</h2>
                <p className="mb-12">
                    {text.p5}
                </p>

                <hr className="border-gray-800 my-8" />
                <p className="text-sm text-gray-500">
                    {text.updated} {new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
