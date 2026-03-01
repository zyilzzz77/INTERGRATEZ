"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function DocsContent({ dict, lang }: { dict: any, lang: string }) {
    const text = dict.docs;

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-neutral-900 px-4 py-12 text-neutral-200">
                <m.div
                    className="mx-auto max-w-4xl"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {/* Header */}
                    <m.div variants={item} className="mb-12 text-center">
                        <h1 className="text-4xl font-black text-white md:text-5xl">
                            {text.title}
                        </h1>
                        <p className="mt-4 text-lg text-neutral-400">
                            {text.subtitle}
                        </p>
                    </m.div>

                    {/* Navigation */}
                    <m.div variants={item} className="mb-12 flex flex-wrap justify-center gap-3">
                        <a href="#downloader" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            {text.navDownloader}
                        </a>
                        <a href="#search" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            {text.navSearch}
                        </a>
                        <a href="#stalker" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            {text.navStalker}
                        </a>
                        <a href="#tools" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
                            {text.navTools}
                        </a>
                    </m.div>

                    <div className="space-y-12">
                        {/* SECTION: DOWNLOADER */}
                        <m.section variants={item} id="downloader" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-2xl">⬇️</span>
                                <h2 className="text-2xl font-bold text-white">{text.hDownloader}</h2>
                            </div>

                            <div className="space-y-8">
                                <DocItem
                                    text={text}
                                    title={text.d1Title}
                                    desc={text.d1Desc}
                                    steps={[
                                        text.d1Step1,
                                        text.d1Step2,
                                        text.d1Step3,
                                        text.d1Step4
                                    ]}
                                    example="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                />

                                <DocItem
                                    text={text}
                                    title={text.d2Title}
                                    desc={text.d2Desc}
                                    steps={[
                                        text.d2Step1,
                                        text.d2Step2,
                                        text.d2Step3,
                                        text.d2Step4
                                    ]}
                                    example="https://www.tiktok.com/@tiktok/video/7296366226223336710"
                                />

                                <DocItem
                                    text={text}
                                    title={text.d3Title}
                                    desc={text.d3Desc}
                                    steps={[
                                        text.d3Step1,
                                        text.d3Step2,
                                        text.d3Step3,
                                        text.d3Step4
                                    ]}
                                    example="https://www.instagram.com/p/Cynj2rOy_z_/"
                                />

                                <DocItem
                                    text={text}
                                    title={text.d4Title}
                                    desc={text.d4Desc}
                                    steps={[
                                        text.d4Step1,
                                        text.d4Step2,
                                        text.d4Step3
                                    ]}
                                    example="https://www.facebook.com/watch/?v=123456789"
                                />

                                <DocItem
                                    text={text}
                                    title={text.d5Title}
                                    desc={text.d5Desc}
                                    steps={[
                                        text.d5Step1,
                                        text.d5Step2,
                                        text.d5Step3
                                    ]}
                                />
                            </div>
                        </m.section>

                        {/* SECTION: SEARCH ENGINE */}
                        <m.section variants={item} id="search" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-2xl">🔍</span>
                                <h2 className="text-2xl font-bold text-white">{text.hSearch}</h2>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <SearchItem
                                    text={text}
                                    icon="▶️"
                                    title={text.s1Title}
                                    url={`/${lang}/search/youtube`}
                                    desc={text.s1Desc}
                                    query={text.s1Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="🎵"
                                    title={text.s2Title}
                                    url={`/${lang}/search/spotify`}
                                    desc={text.s2Desc}
                                    query={text.s2Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="📸"
                                    title={text.s3Title}
                                    url={`/${lang}/search/instagram`}
                                    desc={text.s3Desc}
                                    query={text.s3Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="🎬"
                                    title={text.s4Title}
                                    url={`/${lang}/search/tiktok`}
                                    desc={text.s4Desc}
                                    query={text.s4Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="📌"
                                    title={text.s5Title}
                                    url={`/${lang}/search/pinterest`}
                                    desc={text.s5Desc}
                                    query={text.s5Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="☁️"
                                    title={text.s6Title}
                                    url={`/${lang}/search/soundcloud`}
                                    desc={text.s6Desc}
                                    query={text.s6Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="📺"
                                    title={text.s7Title}
                                    url={`/${lang}/search/bilibili`}
                                    desc={text.s7Desc}
                                    query={text.s7Query}
                                />
                                <SearchItem
                                    text={text}
                                    icon="🍎"
                                    title={text.s8Title}
                                    url={`/${lang}/search/applemusic`}
                                    desc={text.s8Desc}
                                    query={text.s8Query}
                                />
                            </div>
                        </m.section>

                        {/* SECTION: TOOLS */}
                        <m.section variants={item} id="tools" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl">🧰</span>
                                <h2 className="text-2xl font-bold text-white">{text.hTools}</h2>
                            </div>

                            <div className="space-y-6">
                                <DocItem
                                    text={text}
                                    title={text.t1Title}
                                    desc={text.t1Desc}
                                    steps={[
                                        text.t1Step1,
                                        text.t1Step2,
                                        text.t1Step3
                                    ]}
                                    example="123456789"
                                />

                                <DocItem
                                    text={text}
                                    title={text.t2Title}
                                    desc={text.t2Desc}
                                    steps={[
                                        text.t2Step1,
                                        text.t2Step2,
                                        text.t2Step3
                                    ]}
                                    example="iPhone 15"
                                />

                                <DocItem
                                    text={text}
                                    title={text.t3Title}
                                    desc={text.t3Desc}
                                    steps={[
                                        text.t3Step1,
                                        text.t3Step2,
                                        text.t3Step3
                                    ]}
                                    example="vercel"
                                />
                            </div>
                        </m.section>

                        {/* SECTION: STALKER */}
                        <m.section variants={item} id="stalker" className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-6">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 text-2xl">👤</span>
                                <h2 className="text-2xl font-bold text-white">{text.hStalker}</h2>
                            </div>

                            <div className="space-y-6">
                                <DocItem
                                    text={text}
                                    title={text.st1Title}
                                    desc={text.st1Desc}
                                    steps={[
                                        text.st1Step1,
                                        text.st1Step2,
                                        text.st1Step3
                                    ]}
                                    example="jokowi"
                                />

                                <DocItem
                                    text={text}
                                    title={text.st2Title}
                                    desc={text.st2Desc}
                                    steps={[
                                        text.st2Step1,
                                        text.st2Step2,
                                        text.st2Step3,
                                        text.st2Step4
                                    ]}
                                    example="sandys.ss"
                                />
                            </div>
                        </m.section>
                    </div>

                    <m.div variants={item} className="mt-12 text-center">
                        <Link
                            href={`/${lang}/`}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
                        >
                            {text.backHome}
                        </Link>
                    </m.div>
                </m.div>
            </div>
        </LazyMotion>
    );
}

function DocItem({ text, title, desc, steps, example }: { text: any, title: string, desc: string, steps: string[], example?: string }) {
    return (
        <div className="rounded-xl border border-white/5 bg-black/20 p-5 transition hover:bg-black/30">
            <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
            <p className="mb-4 text-sm text-neutral-400">{desc}</p>

            <div className="mb-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{text.howToUse}</p>
                <ol className="list-decimal space-y-1 pl-4 text-sm text-neutral-300">
                    {steps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            </div>

            {example && (
                <div className="rounded-lg bg-black/40 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase text-neutral-500">{text.egLink}</p>
                    <code className="block break-all font-mono text-xs text-green-400">{example}</code>
                </div>
            )}
        </div>
    );
}

function SearchItem({ text, icon, title, url, desc, query }: { text: any, icon: string, title: string, url: string, desc: string, query: string }) {
    return (
        <div className="flex flex-col rounded-xl border border-white/5 bg-black/20 p-5 transition hover:border-white/20 hover:bg-black/30">
            <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <p className="mb-4 flex-1 text-sm text-neutral-400">{desc}</p>
            <div className="mb-4 rounded-lg bg-black/40 p-2">
                <p className="text-[10px] text-neutral-500">{text.egQuery}</p>
                <p className="font-mono text-xs text-sky-400">"{query}"</p>
            </div>
            <Link
                href={url}
                className="mt-auto block w-full rounded-lg bg-white/10 py-2 text-center text-xs font-bold text-white transition hover:bg-white/20"
            >
                {text.tryBtn}
            </Link>
        </div>
    );
}
