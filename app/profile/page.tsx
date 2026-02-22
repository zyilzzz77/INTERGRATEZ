import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Key, Lock, Shield, MoreHorizontal, Wallet, Users,
    Gem, Calendar, Fingerprint, Mail, Hash, Activity, Cpu
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import WeeklyChart from "@/components/WeeklyChart";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!dbUser) {
        redirect("/api/auth/signin");
    }

    const joinedDate = new Date(dbUser.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const isPremium = dbUser.role === "premium" || dbUser.role === "admin";

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-12 pt-24 sm:pt-[100px]">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">

                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col gap-5 mb-6 sm:mb-8">
                    {/* User Info Row */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-blue-500 p-[2px] sm:p-1">
                                <div className="h-full w-full rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                                    {dbUser.image ? (
                                        <Image src={dbUser.image} alt={dbUser.name || "User"} width={80} height={80} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xl sm:text-3xl font-bold text-neutral-500 dark:text-neutral-400">
                                            {dbUser.name ? dbUser.name.charAt(0).toUpperCase() : "U"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-neutral-800 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-white cursor-pointer hover:bg-neutral-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z" /></svg>
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-lg font-bold text-neutral-800 dark:text-neutral-200">
                                Welcome back,
                            </p>
                            <h1 className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span className="truncate">{dbUser.name || "User Name"}</span>
                                <svg className="text-blue-500 h-4 w-4 sm:h-5 sm:w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                            </h1>
                        </div>
                    </div>

                    {/* Action Buttons - horizontal scroll on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        <Link href="/topup" className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0">
                            <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Top Up
                        </Link>
                        <button className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0">
                            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Password
                        </button>
                        <button className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0">
                            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Whitelist IP
                        </button>
                        <button className="flex items-center justify-center rounded-lg bg-white dark:bg-neutral-900 p-2 text-neutral-700 dark:text-neutral-300 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 shrink-0">
                            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>

                {/* --- 4 STATS CARDS --- */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {/* Card 1 - Balance */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white dark:bg-neutral-900 p-3 sm:p-5 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Balance</p>
                            <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white truncate">{dbUser.credits.toLocaleString()} Cr</p>
                        </div>
                    </div>

                    {/* Card 2 - Role */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white dark:bg-neutral-900 p-3 sm:p-5 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Users className="h-4 w-4 sm:h-6 sm:w-6 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Role</p>
                            <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white capitalize truncate">{dbUser.role}</p>
                        </div>
                    </div>

                    {/* Card 3 - Premium */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white dark:bg-neutral-900 p-3 sm:p-5 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Gem className={`h-4 w-4 sm:h-6 sm:w-6 ${isPremium ? 'text-green-500' : 'text-neutral-500 dark:text-neutral-400'}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Premium</p>
                            <p className={`text-sm sm:text-lg font-bold truncate ${isPremium ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-white'}`}>
                                {isPremium ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    {/* Card 4 - Joined */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white dark:bg-neutral-900 p-3 sm:p-5 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Joined</p>
                            <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white truncate">{joinedDate}</p>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* Left: Chart Area (compact, real-time) */}
                    <div className="lg:col-span-2">
                        <WeeklyChart />
                    </div>

                    {/* Right: Account Details */}
                    <div className="rounded-xl bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700 dark:text-neutral-300" />
                            <h2 className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white">Account Details</h2>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:gap-3">
                            {/* Email */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">Email</p>
                                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">{dbUser.email}</p>
                                </div>
                            </div>

                            {/* Limit */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">Limit</p>
                                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">{dbUser.credits.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Account ID */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
                                <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">Account ID</p>
                                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate font-mono tracking-wider">
                                        {dbUser.accountId || "Generating..."}
                                    </p>
                                </div>
                            </div>

                            {/* Expiry */}
                            {dbUser.creditsExpiry && (
                                <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
                                    <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">Credits Expiry</p>
                                        <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                            {new Date(dbUser.creditsExpiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
