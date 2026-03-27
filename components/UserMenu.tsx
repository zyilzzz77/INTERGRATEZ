"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Coins, LogOut, CreditCard, User, ChevronDown, BookOpen, Headphones } from "lucide-react";

export default function UserMenu({ dict, lang }: { dict: any; lang: string }) {
    const { data: session, status } = useSession();
    const [open, setOpen] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [isGuest, setIsGuest] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    // Fetch credits with real-time polling
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch("/api/user/credits");
                if (!res.ok) return;
                const data = await res.json();
                setCredits(data.credits);
                setIsGuest(data.isGuest);
            } catch {
                setCredits(null);
            }
        };
        fetchCredits();

        // Poll every 5 seconds for real-time updates
        const interval = setInterval(fetchCredits, 5000);
        return () => clearInterval(interval);
    }, [session]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (status === "loading") {
        return (
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-200 border-[3px] border-black sm:h-10 sm:w-10" />
        );
    }

    // Not logged in
    if (!session?.user) {
        return (
            <div className="flex items-center gap-2">
                {/* Guest credits badge */}
                <div className="flex items-center gap-1 rounded-xl bg-white border-[3px] border-black px-2.5 py-1 text-xs font-bold text-black shadow-neo-sm">
                    <Coins className="h-3.5 w-3.5 text-orange-500" />
                    <span>{credits ?? 100}</span>
                </div>
                <button
                    onClick={() => signIn("google")}
                    className="flex items-center gap-1.5 rounded-xl bg-white border-[3px] border-black px-3 py-1.5 text-xs font-black text-black shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all sm:px-4 sm:py-2 sm:text-sm"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#fb9005ff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {dict.login || "Login"}
                </button>
            </div>
        );
    }

    // Logged in
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-xl bg-white border-[3px] border-black px-1.5 py-1 shadow-neo-sm hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo transition-all max-w-[200px]"
            >
                {/* Credits badge */}
                <div className="flex items-center gap-1 rounded-lg bg-[#fff6e8] px-2 py-0.5 text-xs shrink-0 border-2 border-black">
                    <Coins className="h-3 w-3 text-orange-500" />
                    <span className="font-bold text-black">{credits ?? "..."}</span>
                </div>
                {/* Avatar */}
                {session.user.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="h-7 w-7 rounded-lg object-cover sm:h-8 sm:w-8 shrink-0 border-2 border-black"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#a0d1d6] border-2 border-black text-xs font-bold text-black sm:h-8 sm:w-8 shrink-0">
                        {session.user.name?.charAt(0) || "U"}
                    </div>
                )}
                <ChevronDown className={`h-4 w-4 text-black font-black transition-transform shrink-0 ${open ? "rotate-180" : ""}`} strokeWidth={3} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl bg-white shadow-neo border-[3px] border-black z-50">
                    {/* User info */}
                    <div className="border-b-[3px] border-black bg-[#e8e6d7] p-4">
                        <div className="flex items-center gap-3">
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-xl object-cover border-2 border-black bg-white"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white text-sm font-bold text-black shadow-neo-sm">
                                    {session.user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-black text-black">{session.user.name}</p>
                                <p className="truncate text-xs font-bold text-black/70">{session.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Credits */}
                    <div className="border-b-[3px] border-black p-4 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff6e8] border-2 border-black">
                                    <Coins className="h-4 w-4 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500">{dict.creditBalance || "Sisa Kredit"}</p>
                                    <p className="text-lg font-black text-black">{credits ?? "..."}</p>
                                </div>
                            </div>
                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${isGuest ? "bg-gray-200 text-gray-700" : "bg-[#a0d1d6] text-black"
                                }`}>
                                {isGuest ? (dict.free || "Free") : (credits && credits > 100 ? (dict.premium || "Premium") : (dict.free || "Free"))}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 border-t-[3px] border-black bg-white">
                        <Link
                            href={`/${lang}/topup`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-black border-2 border-transparent hover:border-black hover:bg-[#a0d1d6] hover:shadow-neo-sm transition-all"
                        >
                            <CreditCard className="h-4 w-4 text-emerald-600" strokeWidth={3} />
                            {dict.pricing || "Pricing & Packages"}
                        </Link>
                        <Link
                            href={`/${lang}/docs`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-black border-2 border-transparent hover:border-black hover:bg-[#ffb3c6] hover:shadow-neo-sm transition-all"
                        >
                            <BookOpen className="h-4 w-4 text-purple-600" strokeWidth={3} />
                            {dict.apiDocs || "API Documentation"}
                        </Link>
                        <Link
                            href={`/${lang}/profile`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-black border-2 border-transparent hover:border-black hover:bg-[#e8e6d7] hover:shadow-neo-sm transition-all"
                        >
                            <User className="h-4 w-4 text-blue-600" strokeWidth={3} />
                            {dict.profile || "My Profile"}
                        </Link>
                        <a
                            href="https://wa.me/6289525129168"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-black border-2 border-transparent hover:border-black hover:bg-orange-200 hover:shadow-neo-sm transition-all"
                        >
                            <Headphones className="h-4 w-4 text-orange-600" strokeWidth={3} />
                            Customer Services
                        </a>
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 border-2 border-transparent hover:border-red-600 hover:bg-red-50 hover:shadow-neo-sm transition-all mt-1"
                        >
                            <LogOut className="h-4 w-4" strokeWidth={3} />
                            {dict.logout || "Logout"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
