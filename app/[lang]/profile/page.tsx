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
        <div className="min-h-screen bg-[#f6f6ee] pb-16 pt-28 sm:pt-[110px]">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">

                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col gap-5 mb-8">
                    {/* User Info Row */}
                    <div className="relative flex items-center gap-4 rounded-2xl border-[3px] border-black bg-[#a0d1d6] px-4 py-4 sm:px-6 sm:py-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="absolute -top-3 -left-3 inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-xs font-black uppercase border-[3px] border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                            Profile
                        </div>
                        <div className="absolute -top-3 -right-3 inline-flex items-center gap-2 rounded-xl bg-[#ffed4a] px-3 py-1 text-[11px] font-black uppercase border-[3px] border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rotate-1">
                            <span className="bg-black text-white rounded-sm px-1">LIVE</span>
                            Safe Session
                        </div>
                        <div className="relative shrink-0">
                            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white border-[3px] border-black overflow-hidden flex items-center justify-center">
                                {dbUser.image ? (
                                    <Image src={dbUser.image} alt={dbUser.name || "User"} width={96} height={96} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl sm:text-3xl font-black text-neutral-700">
                                        {dbUser.name ? dbUser.name.charAt(0).toUpperCase() : "U"}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-black text-white border-[3px] border-white flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                                <Pencil className="w-3 h-3" />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-black text-black/80 uppercase tracking-wide">
                                Welcome back
                            </p>
                            <h1 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 truncate">
                                <span className="truncate">{dbUser.name || "User Name"}</span>
                                <BadgeCheck className="text-blue-600 h-5 w-5 shrink-0 fill-blue-600 stroke-white" />
                            </h1>
                            <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-black/80">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-white border-[2px] border-black px-3 py-1 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                                    <Fingerprint className="h-4 w-4" /> ID: {dbUser.accountId || "Generating..."}
                                </span>
                                {isVip && <UnlimitedBadge />}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - horizontal scroll on mobile */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        <Link href="/topup" className="flex items-center gap-1.5 rounded-xl bg-white border-[3px] border-black px-4 py-2 text-xs sm:text-sm font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0">
                            <Key className="h-4 w-4" /> Top Up
                        </Link>
                        <button className="flex items-center gap-1.5 rounded-xl bg-white border-[3px] border-black px-4 py-2 text-xs sm:text-sm font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0">
                            <Lock className="h-4 w-4" /> Password
                        </button>
                        <button className="flex items-center gap-1.5 rounded-xl bg-white border-[3px] border-black px-4 py-2 text-xs sm:text-sm font-black text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0">
                            <Shield className="h-4 w-4" /> Whitelist IP
                        </button>
                        <button className="flex items-center justify-center rounded-xl bg-white border-[3px] border-black p-2 text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 shrink-0">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* --- 4 STATS CARDS --- */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                    {/* Card 1 - Balance */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white border-[3px] border-black p-3 sm:p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#a0d1d6] border-[2px] border-black shrink-0">
                            <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/70">Balance</p>
                            <p className="text-sm sm:text-lg font-black text-black truncate">{dbUser.credits.toLocaleString()} Cr</p>
                        </div>
                    </div>

                    {/* Card 2 - Role */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white border-[3px] border-black p-3 sm:p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#a0d1d6] border-[2px] border-black shrink-0">
                            <Users className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="min-w-0 flex-1 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/70">Role</p>
                                <p className="text-sm sm:text-lg font-black text-black capitalize truncate">{dbUser.role}</p>
                            </div>
                            {isVip && <UnlimitedBadge />}
                        </div>
                    </div>

                    {/* Card 3 - Premium */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white border-[3px] border-black p-3 sm:p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#a0d1d6] border-[2px] border-black shrink-0">
                            <Gem className={`h-4 w-4 sm:h-6 sm:w-6 ${isPremium ? 'text-green-600' : 'text-neutral-600'}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/70">Premium</p>
                            <p className={`text-sm sm:text-lg font-black truncate ${isPremium ? 'text-green-700' : 'text-black'}`}>
                                {isPremium ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    {/* Card 4 - Joined */}
                    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-white border-[3px] border-black p-3 sm:p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#a0d1d6] border-[2px] border-black shrink-0">
                            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/70">Joined</p>
                            <p className="text-sm sm:text-lg font-black text-black truncate">{joinedDate}</p>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">

                    {/* Left: (mobile stats) */}
                    <div>
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
                    <div className="rounded-2xl bg-white border-[3px] border-black p-4 sm:p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            <Fingerprint className="h-5 w-5 text-black" />
                            <h2 className="text-sm sm:text-lg font-black text-black">Account Details</h2>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:gap-3">
                            {/* Email */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#f6f6ee] p-3 sm:p-4 border-[2px] border-black">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-black shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-black text-black/70">Email</p>
                                    <p className="text-xs sm:text-sm font-black text-black truncate">{dbUser.email}</p>
                                </div>
                            </div>

                            {/* Limit */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#f6f6ee] p-3 sm:p-4 border-[2px] border-black">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-black shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-black text-black/70">Limit</p>
                                    <p className="text-xs sm:text-sm font-black text-black truncate">
                                        <RealtimeCredits initialCredits={dbUser.credits} />
                                    </p>
                                </div>
                            </div>

                            {/* Bonus Limit */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#f6f6ee] p-3 sm:p-4 border-[2px] border-black">
                                <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-black shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-black text-black/70">Bonus Kredit</p>
                                    <p className="text-xs sm:text-sm font-black text-purple-700 truncate">
                                        <RealtimeBonus initialBonus={dbUser.bonusCredits} />
                                    </p>
                                </div>
                            </div>

                            {/* Account ID */}
                            <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#f6f6ee] p-3 sm:p-4 border-[2px] border-black">
                                <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-black shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs font-black text-black/70">Account ID</p>
                                    <p className="text-xs sm:text-sm font-black text-black truncate font-mono tracking-wider">
                                        {dbUser.accountId || "Generating..."}
                                    </p>
                                </div>
                            </div>

                            {/* Detected IP */}
                            <UserIpDisplay />

                            {/* Expiry */}
                            {dbUser.creditsExpiry && (
                                <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#f6f6ee] p-3 sm:p-4 border-[2px] border-black">
                                    <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-black shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-black text-black/70">Credits Expiry</p>
                                        <p className="text-xs sm:text-sm font-black text-black truncate">
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
