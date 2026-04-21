"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Users, ShoppingBag, TrendingUp, Clock, LogOut, RefreshCw,
    User, CircleDollarSign, ChevronRight, Crown, Zap, Settings,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
interface Stats {
    totalUsers: number;
    totalTransactions: number;
    paidTransactions: number;
    pendingTransactions: number;
    totalRevenue: number;
    newUsersToday: number;
    roleDistribution: { role: string; count: number }[];
    recentTransactions: {
        id: string;
        paymentId: string;
        amount: number;
        credits: number;
        days: number;
        createdAt: string;
        user: { name: string | null; email: string };
    }[];
}

function formatIDR(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-purple-500",
    "vip-max": "bg-yellow-400",
    vip: "bg-yellow-300",
    premium: "bg-blue-400",
    free: "bg-gray-400",
};

const NAV = [
    { label: "Dashboard", href: "/admin", icon: TrendingUp },
    { label: "Pengguna", href: "/admin/users", icon: Users },
    { label: "Transaksi", href: "/admin/transactions", icon: ShoppingBag },
];

/* ─── Sidebar ─────────────────────────────────────────── */
function Sidebar({ active = "dashboard" }: { active?: string }) {
    const router = useRouter();
    return (
        <aside className="w-64 min-h-screen bg-[#111] border-r-[3px] border-white/10 flex flex-col shrink-0">
            <div className="p-6 border-b-[3px] border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ffeb3b] rounded-xl border-[3px] border-white flex items-center justify-center">
                        <Settings className="w-5 h-5 text-black" strokeWidth={3} />
                    </div>
                    <div>
                        <p className="text-white font-black uppercase text-sm tracking-wide">Inversave</p>
                        <p className="text-white/40 text-xs font-bold">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {NAV.map(({ label, href, icon: Icon }) => {
                    const isActive = active === label.toLowerCase();
                    return (
                        <button
                            key={href}
                            onClick={() => router.push(href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${isActive
                                ? "bg-[#ffeb3b] text-black border-[2px] border-white shadow-[3px_3px_0_white]"
                                : "text-white/60 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon className="w-4 h-4" strokeWidth={3} />
                            {label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t-[3px] border-white/10">
                <button
                    onClick={async () => { await fetch("/api/admin/auth/logout", {method:"POST"}); window.location.href="/admin/login"; }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4" strokeWidth={3} />
                    Keluar
                </button>
            </div>
        </aside>
    );
}

/* ─── Stat Card ───────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; color: string;
}) {
    return (
        <div className={`${color} border-[3px] border-white rounded-2xl p-5 shadow-[4px_4px_0_white] relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                <Icon className="w-full h-full" />
            </div>
            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {sub && <p className="text-white/60 text-xs font-bold mt-1">{sub}</p>}
        </div>
    );
}

/* ─── Dashboard Page ──────────────────────────────────── */
export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setStats(data);
            setLastRefresh(new Date());
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchStats]);

    return (
        <div className="flex min-h-screen bg-[#0f0f0f]">
            <Sidebar active="dashboard" />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Dashboard</h1>
                        <p className="text-white/40 font-bold text-sm mt-1">
                            Terakhir diperbarui: {lastRefresh.toLocaleTimeString("id-ID")}
                        </p>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white/10 border-[2px] border-white/20 text-white rounded-xl px-4 py-2 font-bold text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Pengguna" value={stats?.totalUsers ?? "—"} icon={Users} color="bg-blue-600" sub={`+${stats?.newUsersToday ?? 0} hari ini`} />
                    <StatCard label="Total Revenue" value={stats ? formatIDR(stats.totalRevenue) : "—"} icon={CircleDollarSign} color="bg-green-700" sub={`${stats?.paidTransactions ?? 0} transaksi sukses`} />
                    <StatCard label="Transaksi Pending" value={stats?.pendingTransactions ?? "—"} icon={Clock} color="bg-yellow-600" sub="Menunggu pembayaran" />
                    <StatCard label="Total Transaksi" value={stats?.totalTransactions ?? "—"} icon={ShoppingBag} color="bg-purple-700" sub="Semua status" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Role Distribution */}
                    <div className="bg-white/5 border-[3px] border-white/10 rounded-2xl p-6">
                        <h2 className="text-white font-black uppercase tracking-wide text-sm mb-4 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" /> Distribusi Role
                        </h2>
                        <div className="space-y-3">
                            {stats?.roleDistribution.sort((a, b) => b.count - a.count).map(({ role, count }) => (
                                <div key={role} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${ROLE_COLORS[role] || "bg-gray-500"}`} />
                                        <span className="text-white font-bold text-sm capitalize">{role}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${ROLE_COLORS[role] || "bg-gray-500"}`}
                                                style={{ width: `${Math.min(100, (count / (stats?.totalUsers || 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-white/60 text-sm font-bold w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white/5 border-[3px] border-white/10 rounded-2xl p-6">
                        <h2 className="text-white font-black uppercase tracking-wide text-sm mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-400" /> Transaksi Terbaru
                        </h2>
                        <div className="space-y-3">
                            {stats?.recentTransactions.length === 0 && (
                                <p className="text-white/40 font-bold text-sm">Belum ada transaksi sukses.</p>
                            )}
                            {stats?.recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-white/60" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-xs truncate max-w-[130px]">
                                                {tx.user.name || tx.user.email}
                                            </p>
                                            <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-black text-sm">{formatIDR(tx.amount)}</p>
                                        <p className="text-white/40 text-xs">{tx.days}h</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export { Sidebar };
