"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import { LazyMotion, domAnimation, m } from "framer-motion";

export default function Navbar({ dict, lang }: { dict: any; lang: string }) {
    const pathname = usePathname();

    const links = [
        {
            href: "/",
            label: dict.home || "Home",
            icon: <Home className="h-4 w-4 sm:h-5 sm:w-5" />,
        },
        {
            href: "/search",
            label: dict.search || "Search",
            icon: <Search className="h-4 w-4 sm:h-5 sm:w-5" />,
        },
    ];

    return (
        <LazyMotion features={domAnimation}>
            <m.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="sticky top-0 z-50 w-full bg-background pt-2 pb-2"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
            >
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    {/* Logo Text */}
                    <Link href={`/${lang}`} className="flex items-center select-none gap-2">
                        <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center">
                            inversave
                        </span>
                    </Link>

                    {/* Nav Pills & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {links.map((l) => {
                            const routePath = l.href === "/" ? `/${lang}` : `/${lang}${l.href}`;
                            const active =
                                l.href === "/"
                                    ? pathname === "/" || pathname === `/${lang}`
                                    : pathname.startsWith(routePath) || pathname.startsWith(l.href);
                            return (
                                <Link key={l.href} href={routePath} className="relative group">
                                    <div className={`flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border-[3px] border-black transition-transform duration-200 ease-in-out ${active ? "bg-primary text-black shadow-neo-sm -translate-y-1 -translate-x-1" : "bg-white text-black hover:bg-secondary hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm"}`}>
                                        {l.icon}
                                        <span className="hidden sm:inline">{l.label}</span>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* User Menu */}
                        <div className="rounded-xl border-[3px] border-black bg-[#e2d5cb] transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-sm text-black inline-flex">
                            <UserMenu dict={dict} lang={lang} />
                        </div>
                    </div>
                </div>
            </m.nav>
        </LazyMotion>
    );
}
