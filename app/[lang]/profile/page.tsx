import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return constructMetadata({
        title: 'Profil Pengguna - Inversave',
        description: 'Kelola profil, limit kredit, dan status penggunaan Anda di Inversave.',
        url: `/${lang}/profile`,
        locale: lang === 'id' ? 'id_ID' : 'en_US',
        noIndex: true // Profile shouldn't be indexed
    });
}
import {
    Activity,
    LogOut,
    Mail,
    UserCircle,
    Fingerprint,
    Hash,
    Clock,
    Coins,
    Key,
    Lock,
    Shield,
    MoreHorizontal,
    Wallet,
    Users,
    Gem,
    Calendar,
    Cpu,
    Pencil,
    BadgeCheck
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import WeeklyChart from "@/components/WeeklyChart";
import UserIpDisplay from "@/components/UserIpDisplay";
import RealtimeCredits from "@/components/RealtimeCredits";
import RealtimeBonus from "@/components/RealtimeBonus";
import UnlimitedBadge from "@/components/UnlimitedBadge";

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
    const isVip = dbUser.role === "vip" || dbUser.role === "vip-max";

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
                                <Pencil className="w-2.5 h-2.5" />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-lg font-bold text-neutral-800 dark:text-neutral-200">
                                Welcome back,
                            </p>
                            <h1 className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span className="truncate">{dbUser.name || "User Name"}</span>
                                <BadgeCheck className="text-blue-500 h-4 w-4 sm:h-5 sm:w-5 shrink-0 fill-blue-500 stroke-white" />
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
                        <div className="min-w-0 flex-1 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Role</p>
                                <p className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white capitalize truncate">{dbUser.role}</p>
                            </div>
                            {isVip && <UnlimitedBadge />}
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
                        {/* Active Limit Header */}
                        <div className="grid grid-cols-2 gap-3 sm:hidden mb-6">
                            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 ring-1 ring-amber-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="rounded-lg bg-amber-500/20 p-1.5">
                                        <Coins className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">Active Limit</span>
                                </div>
                                <p className="text-2xl font-black text-amber-500">
                                    <RealtimeCredits initialCredits={dbUser.credits} />
                                </p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 ring-1 ring-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="rounded-lg bg-purple-500/20 p-1.5">
                                        <Gem className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-purple-500 tracking-wider">Bonus Kredit</span>
                                </div>
                                <p className="text-2xl font-black text-purple-500">
                                    <RealtimeBonus initialBonus={dbUser.bonusCredits} />
                                </p>
                            </div>
                        </div>
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
                                    <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                        <RealtimeCredits initialCredits={dbUser.credits} />
                                    </p>
                                </div>
                            </div>

                            {/* Bonus Limit */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
                                <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">Bonus Kredit</p>
                                    <p className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 truncate">
                                        <RealtimeBonus initialBonus={dbUser.bonusCredits} />
                                    </p>
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

                            {/* Detected IP */}
                            <UserIpDisplay />

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
