"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const links = [
    {
        href: "/",
        label: "Home",
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
        ),
        activeColor: "bg-white text-black",
        hoverColor: "hover:bg-white/10 hover:text-white",
    },
    {
        href: "/search",
        label: "Search",
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        activeColor: "bg-white text-black",
        hoverColor: "hover:bg-white/10 hover:text-white",
    },
    {
        href: "/docs",
        label: "Docs",
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
        activeColor: "bg-white text-black",
        hoverColor: "hover:bg-white/10 hover:text-white",
    },
];

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme, mounted } = useTheme();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl transition-colors duration-300 dark:bg-black/60 dark:border-white/10 light:bg-white/80 light:border-black/5">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 select-none">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 shadow-md transition-transform hover:scale-105">
                        <Image
                            src="/snoopy-logo.webp"
                            alt="Logo"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-white dark:text-white light:text-neutral-900">
                        INTERGRA<span className="text-neutral-400">TEZ</span>
                    </span>
                </Link>

                {/* Nav Pills */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 p-1.5 ring-1 ring-white/10 dark:bg-white/5 dark:ring-white/10 light:bg-black/5 light:ring-black/5 transition-all">
                    {links.map((l) => {
                        const active =
                            l.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(l.href);
                        return (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${active
                                    ? "bg-white text-black dark:bg-white dark:text-black light:bg-black light:text-white shadow-sm"
                                    : "text-neutral-400 hover:bg-white/10 hover:text-white dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white light:text-neutral-500 light:hover:bg-black/5 light:hover:text-black"
                                    }`}
                            >
                                {l.icon}
                                {l.label}
                            </Link>
                        );
                    })}

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        disabled={!mounted}
                        className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-all duration-300 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 dark:hover:text-white light:hover:bg-black/5 light:hover:text-black"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle Theme"
                    >
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${theme === 'light' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}
