"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Home, Search, BookOpen, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const links = [
    {
        href: "/",
        label: "Home",
        icon: <Home className="h-4 w-4" />,
    },
    {
        href: "/search",
        label: "Search",
        icon: <Search className="h-4 w-4" />,
    },
    {
        href: "/docs",
        label: "Docs",
        icon: <BookOpen className="h-4 w-4" />,
    },
];

export default function Navbar() {
    const pathname = usePathname();
    const { theme, toggleTheme, mounted } = useTheme();

    return (
        <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 select-none">
                    <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 shadow-md"
                    >
                        <Image
                            src="/snoopy-logo.webp"
                            alt="Logo"
                            fill
                            priority
                            className="object-cover"
                        />
                    </motion.div>
                    <span className="text-xl font-extrabold tracking-tight text-foreground">
                        Inver<span className="text-muted-foreground">save</span>
                    </span>
                </Link>

                {/* Nav Pills */}
                <div className="flex items-center gap-1">
                    {links.map((l) => {
                        const active =
                            l.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(l.href);
                        return (
                            <Button
                                key={l.href}
                                asChild
                                variant="ghost"
                                size="sm"
                                className={`gap-2 font-semibold relative ${active ? "text-foreground" : "text-muted-foreground"}`}
                            >
                                <Link href={l.href}>
                                    {active && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute inset-0 bg-secondary rounded-md -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {l.icon}
                                    {l.label}
                                </Link>
                            </Button>
                        );
                    })}

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        disabled={!mounted}
                        className="ml-1"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle Theme"
                    >
                        <motion.div
                            key={theme}
                            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </motion.div>
                    </Button>
                </div>
            </div>
        </motion.nav>
    );
}
