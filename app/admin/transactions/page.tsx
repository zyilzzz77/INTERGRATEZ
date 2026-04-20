"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    RefreshCw, ChevronLeft, ChevronRight, Users,
    ShoppingBag, TrendingUp, LogOut, Settings, Filter,
} from "lucide-react";

interface TransactionRow {
    id: string;
    paymentId: string;
    amount: number;
    credits: number;
    bonusCredits: number;
    days: number;
    status: string;
    payUrl: string | null;
    createdAt: string;
    user: { name: string | null; email: string; accountId: string | null };
}

const STATUS_BADGE: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400 border border-green-500/40",
    pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
    failed: "bg-red-500/20 text-red-400 border border-red-500/40",
};

function formatIDR(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}

function Sidebar({ active }: { active: string }) {
    const router = useRouter();
    const NAV = [
        { label: "Dashboard", href: "/admin", icon: TrendingUp },
        { label: "Pengguna", href: "/admin/users", icon: Users },
        { label: "Transaksi", href: "/admin/transactions", icon: ShoppingBag },
    ];
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
                        <button key={href} onClick={() => router.push(href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${isActive ? "bg-[#ffeb3b] text-black border-[2px] border-white shadow-[3px_3px_0_white]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                            <Icon className="w-4 h-4" strokeWidth={3} />{label}
                        </button>
                    );
                })}
            </nav>
            <div className="p-4 border-t-[3px] border-white/10">
                <button onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors">
                    <LogOut className="w-4 h-4" strokeWidth={3} />Keluar
                </button>
            </div>
        </aside>
    );
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchTx = useCallback(async (p = 1, s = statusFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), status: s });
            const res = await fetch(`/api/admin/transactions?${params}`);
            const data = await res.json();
            setTransactions(data.transactions);
            setTotal(data.total);
            setPages(data.pages);
            setPage(p);
        } catch { } finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { fetchTx(1); }, []);

    const handleStatusFilter = (val: string) => {
        setStatusFilter(val);
        fetchTx(1, val);
    };

    // Revenue from current filter
    const totalFiltered = transactions.reduce((s, t) => t.status === "paid" ? s + t.amount : s, 0);

    return (
        <div className="flex min-h-screen bg-[#0f0f0f]">
            <Sidebar active="transaksi" />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Transaksi</h1>
                        <p className="text-white/40 font-bold text-sm mt-1">{total} total transaksi</p>
                    </div>
                    <button onClick={() => fetchTx(page)} disabled={loading}
                        className="flex items-center gap-2 bg-white/10 border-[2px] border-white/20 text-white rounded-xl px-4 py-2 font-bold text-sm hover:bg-white/20 disabled:opacity-50 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-5 items-center">
                    <Filter className="w-4 h-4 text-white/40" />
                    {["", "paid", "pending", "failed"].map((s) => (
                        <button key={s}
                            onClick={() => handleStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide border-[2px] transition-colors ${statusFilter === s
                                ? "bg-[#ffeb3b] text-black border-white"
                                : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20"
                                }`}>
                            {s || "Semua"}
                        </button>
                    ))}
                    {statusFilter === "paid" && transactions.length > 0 && (
                        <span className="ml-auto text-green-400 font-black text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
                            Revenue halaman ini: {formatIDR(totalFiltered)}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white/5 border-[3px] border-white/10 rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b-[2px] border-white/10">
                                {["Payment ID", "Pengguna", "Status", "Jumlah", "Kredit", "Periode", "Tanggal"].map(h => (
                                    <th key={h} className="text-white/40 font-black text-xs uppercase tracking-widest text-left px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={7} className="text-center py-12 text-white/40 font-bold">Memuat...</td></tr>}
                            {!loading && transactions.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-white/40 font-bold">Tidak ada transaksi.</td></tr>}
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <code className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded-lg">
                                            {tx.paymentId.slice(0, 20)}...
                                        </code>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-white font-bold text-sm truncate max-w-[140px]">{tx.user.name || "—"}</p>
                                        <p className="text-white/40 text-xs truncate max-w-[140px]">{tx.user.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${STATUS_BADGE[tx.status] || "bg-white/10 text-white"}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-white font-bold text-sm">
                                        {formatIDR(tx.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-white/70 text-sm font-bold">{tx.credits}</td>
                                    <td className="px-4 py-3 text-white/70 text-sm font-bold">{tx.days} hari</td>
                                    <td className="px-4 py-3 text-white/40 text-xs font-bold">{formatDate(tx.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-white/40 text-sm font-bold">Halaman {page} dari {pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchTx(page - 1)} disabled={page <= 1 || loading}
                                className="w-9 h-9 bg-white/10 border-[2px] border-white/20 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => fetchTx(page + 1)} disabled={page >= pages || loading}
                                className="w-9 h-9 bg-white/10 border-[2px] border-white/20 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
