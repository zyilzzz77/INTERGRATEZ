"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Coins, LogOut, CreditCard, User, ChevronDown } from "lucide-react";

export default function UserMenu() {
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
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10 sm:h-10 sm:w-10" />
        );
    }

    // Not logged in
    if (!session?.user) {
        return (
            <div className="flex items-center gap-2">
                {/* Guest credits badge */}
                <div className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-neutral-400 ring-1 ring-white/10">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold text-white">{credits ?? 100}</span>
                </div>
                <button
                    onClick={() => signIn("google")}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black transition hover:bg-white/90 sm:px-4 sm:py-2 sm:text-sm"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Login
                </button>
            </div>
        );
    }

    // Logged in
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-full bg-white/5 px-1.5 py-1 ring-1 ring-white/10 transition hover:bg-white/10 max-w-[200px]"
            >
                {/* Credits badge */}
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs shrink-0">
                    <Coins className="h-3 w-3 text-amber-400" />
                    <span className="font-bold text-amber-300">{credits ?? "..."}</span>
                </div>
                {/* Avatar */}
                {session.user.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8 shrink-0"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white sm:h-8 sm:w-8 shrink-0">
                        {session.user.name?.charAt(0) || "U"}
                    </div>
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 z-50">
                    {/* User info */}
                    <div className="border-b border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                                    {session.user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold text-white">{session.user.name}</p>
                                <p className="truncate text-xs text-neutral-400">{session.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Credits */}
                    <div className="border-b border-white/10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                                    <Coins className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-400">Sisa Kredit</p>
                                    <p className="text-lg font-black text-white">{credits ?? "..."}</p>
                                </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isGuest ? "bg-neutral-700 text-neutral-300" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                {isGuest ? "Free" : (credits && credits > 100 ? "Premium" : "Free")}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                        <Link
                            href="/topup"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition hover:bg-white/5"
                        >
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            Top Up Kredit
                        </Link>
                        <Link
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white transition hover:bg-white/5"
                        >
                            <User className="h-4 w-4 text-blue-400" />
                            Profil Saya
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
