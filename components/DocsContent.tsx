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
            <div className="min-h-screen bg-neutral-950 text-neutral-200">
                {/* Hero Header */}
                <div className="relative overflow-hidden border-b border-white/5">
                    {/* Gradient Orbs */}
                    <div className="pointer-events-none absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />
                    <div className="pointer-events-none absolute -top-20 right-1/4 h-60 w-60 rounded-full bg-purple-500/10 blur-[100px]" />

                    <m.div
                        className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center md:pt-28"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        <m.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-sm">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            v5.5 — Updated 2025
                        </m.div>

                        <m.h1 variants={item} className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
                            {text.title}
                        </m.h1>

                        <m.p variants={item} className="mx-auto mt-5 max-w-2xl text-base text-neutral-400 sm:text-lg">
                            {text.subtitle}
                        </m.p>

                        {/* Quick Nav Pills */}
                        <m.div variants={item} className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${activeSection === section.id
                                        ? "bg-white text-black shadow-lg shadow-white/10"
                                        : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
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
                        className="space-y-20"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {/* ═══════ SECTION: DOWNLOADER ═══════ */}
                        <m.section variants={item} id="downloader">
                            <SectionHeader
                                icon={<Download className="w-6 h-6 text-white" />}
                                title={text.hDownloader}
                                gradient="from-blue-500 to-cyan-400"
                                badge={`5 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-8 space-y-4">
                                <DocCard
                                    text={text}
                                    title={text.d1Title}
                                    desc={text.d1Desc}
                                    steps={[text.d1Step1, text.d1Step2, text.d1Step3, text.d1Step4]}
                                    example="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    icon={<Play className="w-5 h-5 text-red-400" />}
                                    accent="border-red-500/20 hover:border-red-500/40"
                                    accentDot="bg-red-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d2Title}
                                    desc={text.d2Desc}
                                    steps={[text.d2Step1, text.d2Step2, text.d2Step3, text.d2Step4]}
                                    example="https://www.tiktok.com/@tiktok/video/7296366226223336710"
                                    icon={<Music className="w-5 h-5 text-pink-400" />}
                                    accent="border-pink-500/20 hover:border-pink-500/40"
                                    accentDot="bg-pink-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d3Title}
                                    desc={text.d3Desc}
                                    steps={[text.d3Step1, text.d3Step2, text.d3Step3, text.d3Step4]}
                                    example="https://www.instagram.com/p/Cynj2rOy_z_/"
                                    icon={<Camera className="w-5 h-5 text-purple-400" />}
                                    accent="border-purple-500/20 hover:border-purple-500/40"
                                    accentDot="bg-purple-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d4Title}
                                    desc={text.d4Desc}
                                    steps={[text.d4Step1, text.d4Step2, text.d4Step3]}
                                    example="https://www.facebook.com/watch/?v=123456789"
                                    icon={<Globe className="w-5 h-5 text-blue-400" />}
                                    accent="border-blue-500/20 hover:border-blue-500/40"
                                    accentDot="bg-blue-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.d5Title}
                                    desc={text.d5Desc}
                                    steps={[text.d5Step1, text.d5Step2, text.d5Step3]}
                                    icon={<Globe className="w-5 h-5 text-emerald-400" />}
                                    accent="border-emerald-500/20 hover:border-emerald-500/40"
                                    accentDot="bg-emerald-500"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: SEARCH ENGINE ═══════ */}
                        <m.section variants={item} id="search">
                            <SectionHeader
                                icon={<Search className="w-6 h-6 text-white" />}
                                title={text.hSearch}
                                gradient="from-purple-500 to-pink-400"
                                badge={`8 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <SearchCard
                                    text={text}
                                    icon={<Play className="w-5 h-5 text-red-400" />}
                                    title={text.s1Title}
                                    url={`/${lang}/search/youtube`}
                                    desc={text.s1Desc}
                                    query={text.s1Query}
                                    gradient="from-red-500/10 to-red-600/5"
                                    borderColor="hover:border-red-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Music className="w-5 h-5 text-green-400" />}
                                    title={text.s2Title}
                                    url={`/${lang}/search/spotify`}
                                    desc={text.s2Desc}
                                    query={text.s2Query}
                                    gradient="from-green-500/10 to-green-600/5"
                                    borderColor="hover:border-green-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Camera className="w-5 h-5 text-purple-400" />}
                                    title={text.s3Title}
                                    url={`/${lang}/search/instagram`}
                                    desc={text.s3Desc}
                                    query={text.s3Query}
                                    gradient="from-purple-500/10 to-pink-500/5"
                                    borderColor="hover:border-purple-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Clapperboard className="w-5 h-5 text-pink-400" />}
                                    title={text.s4Title}
                                    url={`/${lang}/search/tiktok`}
                                    desc={text.s4Desc}
                                    query={text.s4Query}
                                    gradient="from-pink-500/10 to-rose-500/5"
                                    borderColor="hover:border-pink-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Pin className="w-5 h-5 text-red-400" />}
                                    title={text.s5Title}
                                    url={`/${lang}/search/pinterest`}
                                    desc={text.s5Desc}
                                    query={text.s5Query}
                                    gradient="from-red-500/10 to-orange-500/5"
                                    borderColor="hover:border-red-400/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Cloud className="w-5 h-5 text-orange-400" />}
                                    title={text.s6Title}
                                    url={`/${lang}/search/soundcloud`}
                                    desc={text.s6Desc}
                                    query={text.s6Query}
                                    gradient="from-orange-500/10 to-orange-600/5"
                                    borderColor="hover:border-orange-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Monitor className="w-5 h-5 text-cyan-400" />}
                                    title={text.s7Title}
                                    url={`/${lang}/search/bilibili`}
                                    desc={text.s7Desc}
                                    query={text.s7Query}
                                    gradient="from-cyan-500/10 to-blue-500/5"
                                    borderColor="hover:border-cyan-500/30"
                                />
                                <SearchCard
                                    text={text}
                                    icon={<Music2 className="w-5 h-5 text-pink-400" />}
                                    title={text.s8Title}
                                    url={`/${lang}/search/applemusic`}
                                    desc={text.s8Desc}
                                    query={text.s8Query}
                                    gradient="from-pink-500/10 to-red-500/5"
                                    borderColor="hover:border-pink-400/30"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: TOOLS ═══════ */}
                        <m.section variants={item} id="tools">
                            <SectionHeader
                                icon={<Wrench className="w-6 h-6 text-white" />}
                                title={text.hTools}
                                gradient="from-emerald-500 to-teal-400"
                                badge={`3 ${lang === "id" ? "Fitur" : "Features"}`}
                            />
                            <div className="mt-8 space-y-4">
                                <DocCard
                                    text={text}
                                    title={text.t1Title}
                                    desc={text.t1Desc}
                                    steps={[text.t1Step1, text.t1Step2, text.t1Step3]}
                                    example="123456789"
                                    icon={<Gamepad2 className="w-5 h-5 text-yellow-400" />}
                                    accent="border-yellow-500/20 hover:border-yellow-500/40"
                                    accentDot="bg-yellow-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.t2Title}
                                    desc={text.t2Desc}
                                    steps={[text.t2Step1, text.t2Step2, text.t2Step3]}
                                    example="iPhone 15"
                                    icon={<ShoppingCart className="w-5 h-5 text-green-400" />}
                                    accent="border-green-500/20 hover:border-green-500/40"
                                    accentDot="bg-green-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.t3Title}
                                    desc={text.t3Desc}
                                    steps={[text.t3Step1, text.t3Step2, text.t3Step3]}
                                    example="vercel"
                                    icon={<Github className="w-5 h-5 text-neutral-300" />}
                                    accent="border-neutral-400/20 hover:border-neutral-400/40"
                                    accentDot="bg-neutral-400"
                                />
                            </div>
                        </m.section>

                        {/* ═══════ SECTION: STALKER ═══════ */}
                        <m.section variants={item} id="stalker">
                            <SectionHeader
                                icon={<User className="w-6 h-6 text-white" />}
                                title={text.hStalker}
                                gradient="from-pink-500 to-rose-400"
                                badge={`2 ${lang === "id" ? "Platform" : "Platforms"}`}
                            />
                            <div className="mt-8 space-y-4">
                                <DocCard
                                    text={text}
                                    title={text.st1Title}
                                    desc={text.st1Desc}
                                    steps={[text.st1Step1, text.st1Step2, text.st1Step3]}
                                    example="jokowi"
                                    icon={<Camera className="w-5 h-5 text-purple-400" />}
                                    accent="border-purple-500/20 hover:border-purple-500/40"
                                    accentDot="bg-purple-500"
                                />
                                <DocCard
                                    text={text}
                                    title={text.st2Title}
                                    desc={text.st2Desc}
                                    steps={[text.st2Step1, text.st2Step2, text.st2Step3, text.st2Step4]}
                                    example="sandys.ss"
                                    icon={<Music className="w-5 h-5 text-pink-400" />}
                                    accent="border-pink-500/20 hover:border-pink-500/40"
                                    accentDot="bg-pink-500"
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
                        <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-12 py-8 backdrop-blur-sm">
                            <p className="text-sm text-neutral-500">
                                {lang === "id" ? "Sudah siap menggunakan Inversave?" : "Ready to use Inversave?"}
                            </p>
                            <Link
                                href={`/${lang}/`}
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-white/5 transition-all duration-300 hover:shadow-white/10 hover:scale-[1.02]"
                            >
                                <span className="relative z-10">{text.backHome}</span>
                                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
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
function SectionHeader({ icon, title, gradient, badge }: {
    icon: ReactNode;
    title: string;
    gradient: string;
    badge: string;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        {title}
                    </h2>
                    <div className={`mt-1 h-1 w-12 rounded-full bg-gradient-to-r ${gradient} opacity-60`} />
                </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-400">
                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${gradient}`} />
                {badge}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════
   DOC CARD COMPONENT (Accordion Style)
   ═══════════════════════════════════════ */
function DocCard({ text, title, desc, steps, example, icon, accent, accentDot }: {
    text: any;
    title: string;
    desc: string;
    steps: string[];
    example?: string;
    icon: ReactNode;
    accent: string;
    accentDot: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`group rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 ${accent} ${isOpen ? "bg-white/[0.04]" : ""}`}
        >
            {/* Header — clickable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${accentDot}`} />
                        <h3 className="truncate text-base font-bold text-white sm:text-lg">{title}</h3>
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1">{desc}</p>
                </div>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Expanded content */}
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="border-t border-white/5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                    <p className="mb-4 text-sm leading-relaxed text-neutral-400">{desc}</p>

                    {/* Steps */}
                    <div className="mb-4">
                        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                            {text.howToUse}
                        </p>
                        <div className="space-y-2">
                            {steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[11px] font-bold text-neutral-400">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm leading-relaxed text-neutral-300">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Example */}
                    {example && (
                        <div className="rounded-xl border border-white/5 bg-black/30 p-3.5">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                {text.egLink}
                            </p>
                            <code className="block break-all font-mono text-xs leading-relaxed text-emerald-400">
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
function SearchCard({ text, icon, title, url, desc, query, gradient, borderColor }: {
    text: any;
    icon: ReactNode;
    title: string;
    url: string;
    desc: string;
    query: string;
    gradient: string;
    borderColor: string;
}) {
    return (
        <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${gradient} transition-all duration-300 ${borderColor}`}>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
                {/* Header */}
                <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        {icon}
                    </span>
                    <h3 className="text-base font-bold text-white">{title}</h3>
                </div>

                {/* Description */}
                <p className="mb-4 flex-1 text-sm leading-relaxed text-neutral-400">{desc}</p>

                {/* Example Query */}
                <div className="mb-4 rounded-xl border border-white/5 bg-black/20 p-3">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                        {text.egQuery}
                    </p>
                    <p className="font-mono text-xs text-sky-400">&quot;{query}&quot;</p>
                </div>

                {/* CTA Button */}
                <Link
                    href={url}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-2.5 text-xs font-bold text-white transition-all duration-300 hover:bg-white/[0.15] active:scale-[0.98]"
                >
                    {text.tryBtn}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
