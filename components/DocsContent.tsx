"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useState, useEffect, ReactNode } from "react";
import {
    Download, Search, Wrench, User,
    Play, Music, Camera, Globe, Gamepad2, ShoppingCart, Github,
    Clapperboard, Pin, Cloud, Monitor, Music2,
    ChevronDown, ArrowRight, ArrowUpRight
} from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

const sections = [
    { id: "downloader", icon: <Download className="w-5 h-5" />, color: "from-blue-500 to-cyan-400" },
    { id: "search", icon: <Search className="w-5 h-5" />, color: "from-purple-500 to-pink-400" },
    { id: "tools", icon: <Wrench className="w-5 h-5" />, color: "from-emerald-500 to-teal-400" },
    { id: "stalker", icon: <User className="w-5 h-5" />, color: "from-pink-500 to-rose-400" },
];

export default function DocsContent({ dict, lang }: { dict: any, lang: string }) {
    const text = dict.docs;
    const [activeSection, setActiveSection] = useState("downloader");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-20% 0px -60% 0px" }
        );

        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-white text-black">
                {/* Hero Header */}
                <div className="relative overflow-hidden border-b-[3px] border-black bg-[#c4b5fd]">

                    <m.div
                        className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center md:pt-28"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        <m.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-4 py-1.5 text-xs font-black text-black shadow-neo-sm uppercase tracking-widest">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse border border-black" />
                            v5.5 — Updated 2025
                        </m.div>

                        <m.h1 variants={item} className="text-4xl font-black tracking-tight text-black sm:text-5xl md:text-6xl uppercase">
                            {text.title}
                        </m.h1>

                        <m.p variants={item} className="mx-auto mt-5 max-w-2xl text-base font-bold text-black/80 sm:text-lg">
                            {text.subtitle}
                        </m.p>

                        {/* Quick Nav Pills */}
                        <m.div variants={item} className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className={`group relative flex items-center gap-2 rounded-xl border-[3px] border-black px-5 py-3 text-sm font-black uppercase transition-all duration-300 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${activeSection === section.id
                                        ? "bg-black text-white"
                                        : "bg-white text-black hover:bg-[#ffeb3b]"
                                        }`}
                                >
                                    <span className="text-base">{section.icon}</span>
                                    {text[`nav${section.id.charAt(0).toUpperCase() + section.id.slice(1)}`]?.replace(/[⬇️🔍👤🧰]/g, "").trim() ||
                                        section.id.charAt(0).toUpperCase() + section.id.slice(1)}
                                </a>
                            ))}
                        </m.div>
                    </m.div>
                </div>

                {/* Main Content */}
                <div className="mx-auto max-w-5xl px-4 py-16">
                    <m.div
                        className="space-y-24"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {/* ═══════ SECTION: DOWNLOADER ═══════ */}
                        <m.section variants={item} id="downloader" className="scroll-mt-32">
                            <SectionHeader
                                icon={<Download className="w-8 h-8 text-black" strokeWidth={3} />}
                                title={text.hDownloader}
                                bg="#a0d1d6"
                                badge={`5 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-10 space-y-5">
                                <DocCard
                                    text={text}
                                    title={text.d1Title}
                                    desc={text.d1Desc}
                                    steps={[text.d1Step1, text.d1Step2, text.d1Step3, text.d1Step4]}
                                    example="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    icon={<Play className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#ffb3c6"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d2Title}
                                    desc={text.d2Desc}
                                    steps={[text.d2Step1, text.d2Step2, text.d2Step3, text.d2Step4]}
                                    example="https://www.tiktok.com/@tiktok/video/7296366226223336710"
                                    icon={<Music className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#ffeb3b"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d3Title}
                                    desc={text.d3Desc}
                                    steps={[text.d3Step1, text.d3Step2, text.d3Step3, text.d3Step4]}
                                    example="https://www.instagram.com/p/Cynj2rOy_z_/"
                                    icon={<Camera className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#c4b5fd"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d4Title}
                                    desc={text.d4Desc}
                                    steps={[text.d4Step1, text.d4Step2, text.d4Step3]}
                                    example="https://www.facebook.com/watch/?v=123456789"
                                    icon={<Globe className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#a0d1d6"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d5Title}
                                    desc={text.d5Desc}
                                    steps={[text.d5Step1, text.d5Step2, text.d5Step3]}
                                    icon={<Globe className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#ecfeff"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: SEARCH ENGINE ═══════ */}
                        <m.section variants={item} id="search" className="scroll-mt-32">
                            <SectionHeader
                                icon={<Search className="w-8 h-8 text-black" strokeWidth={3} />}
                                title={text.hSearch}
                                bg="#c4b5fd"
                                badge={`8 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-10 grid gap-5 sm:grid-cols-2">
                                <SearchCard
                                    text={text}
                                    icon={<Play className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s1Title}
                                    url={`/${lang}/search/youtube`}
                                    desc={text.s1Desc}
                                    query={text.s1Query}
                                    bg="#ffb3c6"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Music className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s2Title}
                                    url={`/${lang}/search/spotify`}
                                    desc={text.s2Desc}
                                    query={text.s2Query}
                                    bg="#a0d1d6"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Camera className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s3Title}
                                    url={`/${lang}/search/instagram`}
                                    desc={text.s3Desc}
                                    query={text.s3Query}
                                    bg="#c4b5fd"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Clapperboard className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s4Title}
                                    url={`/${lang}/search/tiktok`}
                                    desc={text.s4Desc}
                                    query={text.s4Query}
                                    bg="#ffeb3b"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Pin className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s5Title}
                                    url={`/${lang}/search/pinterest`}
                                    desc={text.s5Desc}
                                    query={text.s5Query}
                                    bg="#ffb3c6"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Cloud className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s6Title}
                                    url={`/${lang}/search/soundcloud`}
                                    desc={text.s6Desc}
                                    query={text.s6Query}
                                    bg="#ffeb3b"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Monitor className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s7Title}
                                    url={`/${lang}/search/bilibili`}
                                    desc={text.s7Desc}
                                    query={text.s7Query}
                                    bg="#a0d1d6"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Music2 className="w-8 h-8 text-black" strokeWidth={2.5} />}
                                    title={text.s8Title}
                                    url={`/${lang}/search/applemusic`}
                                    desc={text.s8Desc}
                                    query={text.s8Query}
                                    bg="#c4b5fd"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: TOOLS ═══════ */}
                        <m.section variants={item} id="tools" className="scroll-mt-32">
                            <SectionHeader
                                icon={<Wrench className="w-8 h-8 text-black" strokeWidth={3} />}
                                title={text.hTools}
                                bg="#a0d1d6"
                                badge={`3 ${lang === "id" ? "Fitur" : "Features"}`}
                            />
                            <div className="mt-10 space-y-5">
                                <DocCard
                                    text={text}
                                    title={text.t1Title}
                                    desc={text.t1Desc}
                                    steps={[text.t1Step1, text.t1Step2, text.t1Step3]}
                                    example="123456789"
                                    icon={<Gamepad2 className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#ffeb3b"
                                />
                                <DocCard
                                    text={text}
                                    title={text.t2Title}
                                    desc={text.t2Desc}
                                    steps={[text.t2Step1, text.t2Step2, text.t2Step3]}
                                    example="iPhone 15"
                                    icon={<ShoppingCart className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#a0d1d6"
                                />
                                <DocCard
                                    text={text}
                                    title={text.t3Title}
                                    desc={text.t3Desc}
                                    steps={[text.t3Step1, text.t3Step2, text.t3Step3]}
                                    example="vercel"
                                    icon={<Github className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#c4b5fd"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: STALKER ═══════ */}
                        <m.section variants={item} id="stalker" className="scroll-mt-32">
                            <SectionHeader
                                icon={<User className="w-8 h-8 text-black" strokeWidth={3} />}
                                title={text.hStalker}
                                bg="#ffb3c6"
                                badge={`2 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-10 space-y-5">
                                <DocCard
                                    text={text}
                                    title={text.st1Title}
                                    desc={text.st1Desc}
                                    steps={[text.st1Step1, text.st1Step2, text.st1Step3]}
                                    example="jokowi"
                                    icon={<Camera className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#c4b5fd"
                                />
                                <DocCard
                                    text={text}
                                    title={text.st2Title}
                                    desc={text.st2Desc}
                                    steps={[text.st2Step1, text.st2Step2, text.st2Step3, text.st2Step4]}
                                    example="sandys.ss"
                                    icon={<Music className="w-6 h-6 text-black" strokeWidth={2.5} />}
                                    bg="#ffb3c6"
                                />
                            </div>
                        </m.section>
                    </m.div>

                    {/* Back to Home */}
                    <m.div
                        className="mt-20 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex flex-col items-center gap-4 rounded-2xl border-[3px] border-black bg-white shadow-neo p-10 relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#ffeb3b] border-[3px] border-black rounded-full"></div>
                            <p className="font-black text-black uppercase tracking-wide">
                                {lang === "id" ? "Sudah siap menggunakan Inversave?" : "Ready to use Inversave?"}
                            </p>
                            <Link
                                href={`/${lang}/`}
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-primary border-[3px] border-black px-8 py-3.5 text-sm font-black text-black shadow-neo-sm transition-all duration-300 hover:shadow-neo hover:-translate-x-1 hover:-translate-y-1 uppercase tracking-wider"
                            >
                                <span className="relative z-10">{text.backHome}</span>
                                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={3} />
                            </Link>
                        </div>
                    </m.div>
                </div>
            </div>
        </LazyMotion>
    );
}

/* ═══════════════════════════════════════
   SECTION HEADER COMPONENT
   ═══════════════════════════════════════ */
function SectionHeader({ icon, title, bg, badge }: {
    icon: ReactNode;
    title: string;
    bg: string;
    badge: string;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-black shadow-neo-sm -rotate-2`} style={{ backgroundColor: bg }}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl uppercase">
                        {title}
                    </h2>
                </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-neo-sm">
                <span className={`h-3 w-3 rounded-md border-2 border-black`} style={{ backgroundColor: bg }} />
                {badge}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════
   DOC CARD COMPONENT (Accordion Style)
   ═══════════════════════════════════════ */
function DocCard({ text, title, desc, steps, example, icon, bg }: {
    text: any;
    title: string;
    desc: string;
    steps: string[];
    example?: string;
    icon: ReactNode;
    bg: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`group rounded-2xl border-[3px] border-black bg-white transition-all duration-300 shadow-neo-sm ${isOpen ? "shadow-neo translate-x-[-2px] translate-y-[-2px]" : ""}`}
        >
            {/* Header — clickable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
            >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-black transition-transform group-hover:scale-110 shadow-neo-sm" style={{ backgroundColor: bg }}>
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-black text-black uppercase tracking-wide">{title}</h3>
                    </div>
                    <p className="mt-1 text-sm font-bold text-black/70 line-clamp-1">{desc}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white shadow-neo-sm transition-transform duration-300 ${isOpen ? "rotate-180 bg-black text-white" : "text-black"}`}>
                    <ChevronDown className="h-6 w-6" strokeWidth={3} />
                </div>
            </button>

            {/* Expanded content */}
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="border-t-[3px] border-black px-5 pb-5 pt-4 sm:px-6 sm:pb-6 bg-gray-50 rounded-b-xl">
                    <p className="mb-6 text-sm font-bold leading-relaxed text-black/80">{desc}</p>

                    {/* Steps */}
                    <div className="mb-6">
                        <p className="mb-3 inline-block bg-black text-white px-3 py-1 rounded-lg border-2 border-black text-xs font-black uppercase tracking-widest shadow-neo-sm rotate-1">
                            {text.howToUse}
                        </p>
                        <div className="space-y-4 mt-2">
                            {steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-black text-sm font-black text-black shadow-neo-sm" style={{ backgroundColor: bg }}>
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-bold leading-relaxed text-black pt-1">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Example */}
                    {example && (
                        <div className="rounded-xl border-[3px] border-black bg-white p-4 shadow-neo-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full border-l-[3px] border-black" style={{ backgroundColor: bg }}></div>
                            <p className="mb-2 text-xs font-black uppercase tracking-widest text-black/60">
                                {text.egLink}
                            </p>
                            <code className="block break-all font-mono text-sm font-bold leading-relaxed text-black">
                                {example}
                            </code>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   SEARCH CARD COMPONENT
   ═══════════════════════════════════════ */
function SearchCard({ text, icon, title, url, desc, query, bg }: {
    text: any;
    icon: ReactNode;
    title: string;
    url: string;
    desc: string;
    query: string;
    bg: string;
}) {
    return (
        <div className={`group relative flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white transition-all duration-300 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo`}>
            <div className="flex flex-1 flex-col p-5 sm:p-6" style={{ backgroundColor: bg }}>
                {/* Header */}
                <div className="mb-4 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-black bg-white shadow-neo-sm transition-transform duration-300 group-hover:scale-110 -rotate-2">
                        {icon}
                    </span>
                    <h3 className="text-xl font-black text-black uppercase tracking-wide bg-white px-3 py-1 border-2 border-black rounded-lg shadow-neo-sm rotate-1">{title}</h3>
                </div>

                {/* Description */}
                <p className="mb-5 flex-1 text-sm font-bold leading-relaxed text-black bg-white/60 p-3 rounded-xl border-2 border-black">{desc}</p>

                {/* Example Query */}
                <div className="mb-5 rounded-xl border-[3px] border-black bg-white p-4 shadow-neo-sm">
                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-black/60">
                        {text.egQuery}
                    </p>
                    <p className="font-mono text-sm font-black text-black py-1 px-2 bg-gray-100 rounded border-2 border-black inline-block">&quot;{query}&quot;</p>
                </div>

                {/* CTA Button */}
                <Link
                    href={url}
                    className="flex items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-black py-3 text-sm font-black text-white transition-all duration-300 hover:bg-white hover:text-black uppercase tracking-widest shadow-neo-sm"
                >
                    {text.tryBtn}
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={3} />
                </Link>
            </div>
        </div>
    );
}
