"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Search, RefreshCw, ChevronLeft, ChevronRight, X, Plus,
    Crown, Zap, User, Users, ShoppingBag, TrendingUp, LogOut,
    Settings, Check, AlertCircle,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
interface UserRow {
    id: string;
    name: string | null;
    email: string;
    role: string;
    credits: number;
    bonusCredits: number;
    creditsExpiry: string | null;
    createdAt: string;
    accountId: string | null;
    image: string | null;
    _count: { transactions: number };
}

const ROLE_OPTIONS = ["", "free", "premium", "vip", "vip-max", "admin"];
const ROLE_BADGE: Record<string, string> = {
    admin: "bg-purple-500 text-white",
    "vip-max": "bg-yellow-400 text-black",
    vip: "bg-yellow-300 text-black",
    premium: "bg-blue-400 text-black",
    free: "bg-white/20 text-white",
};

function formatDate(d: string) {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}

/* ─── Sidebar (shared) ────────────────────────────────── */
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
                <button onClick={async () => { await fetch("/api/admin/auth/logout", {method:"POST"}); window.location.href="/admin/login"; }})}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors">
                    <LogOut className="w-4 h-4" strokeWidth={3} />Keluar
                </button>
            </div>
        </aside>
    );
}

/* ─── Grant Modal ─────────────────────────────────────── */
function GrantModal({ user, onClose, onSuccess }: {
    user: UserRow;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [credits, setCredits] = useState(0);
    const [bonusCredits, setBonusCredits] = useState(0);
    const [days, setDays] = useState(30);
    const [role, setRole] = useState(user.role);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const submit = async (action: string) => {
        setLoading(true); setMsg(null);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, action, credits, bonusCredits, role, days }),
            });
            const data = await res.json();
            if (!res.ok) { setMsg({ type: "err", text: data.error || "Gagal" }); }
            else { setMsg({ type: "ok", text: "Berhasil!" }); onSuccess(); }
        } catch { setMsg({ type: "err", text: "Error jaringan" }); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border-[3px] border-white rounded-2xl w-full max-w-md shadow-[6px_6px_0_white]">
                <div className="flex items-center justify-between p-5 border-b-[3px] border-white/10">
                    <div>
                        <h3 className="text-white font-black uppercase text-lg">Edit Pengguna</h3>
                        <p className="text-white/50 text-xs font-bold mt-0.5 truncate max-w-[280px]">{user.name || user.email}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Current info */}
                    <div className="bg-white/5 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-white/40 text-xs font-black uppercase">Kredit</p><p className="text-white font-black text-xl">{user.credits}</p></div>
                        <div><p className="text-white/40 text-xs font-black uppercase">Bonus</p><p className="text-white font-black text-xl">{user.bonusCredits}</p></div>
                        <div><p className="text-white/40 text-xs font-black uppercase">Role</p><span className={`text-xs font-black px-2 py-1 rounded-lg ${ROLE_BADGE[user.role] || "bg-white/10 text-white"}`}>{user.role}</span></div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-white/60 text-xs font-black uppercase tracking-widest block mb-2">Set Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors">
                            {["free", "premium", "vip", "vip-max", "admin"].map(r => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                        </select>
                    </div>

                    {/* VIP Days */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-white/60 text-xs font-black uppercase tracking-widest block mb-2">Tambah Kredit</label>
                            <input type="number" min={0} value={credits} onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors" />
                        </div>
                        <div>
                            <label className="text-white/60 text-xs font-black uppercase tracking-widest block mb-2">Perpanjang (Hari)</label>
                            <input type="number" min={0} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors" />
                        </div>
                    </div>

                    {/* Bonus Credits */}
                    <div>
                        <label className="text-white/60 text-xs font-black uppercase tracking-widest block mb-2">Tambah Bonus Kredit</label>
                        <input type="number" min={0} value={bonusCredits} onChange={(e) => setBonusCredits(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors" />
                    </div>

                    {msg && (
                        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${msg.type === "ok" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {msg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {msg.text}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button onClick={() => submit("add_credits")} disabled={loading}
                            className="flex-1 bg-[#ffeb3b] text-black border-[2px] border-white rounded-xl h-11 font-black text-sm hover:bg-[#ffe01a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />Terapkan
                        </button>
                        <button onClick={() => submit("reset_credits")} disabled={loading}
                            className="flex-1 bg-red-500/20 border-[2px] border-red-500/40 text-red-400 rounded-xl h-11 font-black text-sm hover:bg-red-500/30 disabled:opacity-50 transition-colors">
                            Reset ke Free
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Users Page ──────────────────────────────────────── */
export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchUsers = useCallback(async (p = 1, s = search, r = roleFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), search: s, role: r });
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users);
            setTotal(data.total);
            setPages(data.pages);
            setPage(p);
        } catch { } finally { setLoading(false); }
    }, [search, roleFilter]);

    useEffect(() => { fetchUsers(1); }, []);

    const handleSearch = (val: string) => {
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchUsers(1, val, roleFilter), 400);
    };

    const handleRoleFilter = (val: string) => {
        setRoleFilter(val);
        fetchUsers(1, search, val);
    };

    return (
        <div className="flex min-h-screen bg-[#0f0f0f]">
            <Sidebar active="pengguna" />

            {selectedUser && (
                <GrantModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={() => { fetchUsers(page); setSelectedUser(null); }}
                />
            )}

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Pengguna</h1>
                        <p className="text-white/40 font-bold text-sm mt-1">{total} total pengguna</p>
                    </div>
                    <button onClick={() => fetchUsers(page)} disabled={loading}
                        className="flex items-center gap-2 bg-white/10 border-[2px] border-white/20 text-white rounded-xl px-4 py-2 font-bold text-sm hover:bg-white/20 transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari nama / email..."
                            className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors text-sm placeholder:text-white/30"
                        />
                    </div>
                    <select value={roleFilter} onChange={(e) => handleRoleFilter(e.target.value)}
                        className="bg-white/10 border-[2px] border-white/20 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors text-sm">
                        {ROLE_OPTIONS.map(r => <option key={r} value={r} className="bg-[#111]">{r || "Semua Role"}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white/5 border-[3px] border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-[2px] border-white/10">
                                {["Pengguna", "Role", "Kredit", "Expiry", "Transaksi", "Bergabung", "Aksi"].map(h => (
                                    <th key={h} className="text-white/40 font-black text-xs uppercase tracking-widest text-left px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={7} className="text-center py-12 text-white/40 font-bold">Memuat...</td></tr>
                            )}
                            {!loading && users.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-white/40 font-bold">Tidak ada pengguna.</td></tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                                {u.image
                                                    ? <img src={u.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    : <User className="w-4 h-4 text-white/40" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm truncate max-w-[160px]">{u.name || "—"}</p>
                                                <p className="text-white/40 text-xs truncate max-w-[160px]">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${ROLE_BADGE[u.role] || "bg-white/10 text-white"}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-white font-bold text-sm">
                                        {u.credits} <span className="text-white/40">+{u.bonusCredits}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white/60 text-xs font-bold">
                                        {u.creditsExpiry ? formatDate(u.creditsExpiry) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-white/60 text-sm font-bold text-center">{u._count.transactions}</td>
                                    <td className="px-4 py-3 text-white/40 text-xs font-bold">{formatDate(u.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="bg-[#ffeb3b]/20 border-[2px] border-[#ffeb3b]/40 text-[#ffeb3b] rounded-lg px-3 py-1.5 font-black text-xs hover:bg-[#ffeb3b]/30 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </td>
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
                            <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1 || loading}
                                className="w-9 h-9 bg-white/10 border-[2px] border-white/20 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => fetchUsers(page + 1)} disabled={page >= pages || loading}
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
