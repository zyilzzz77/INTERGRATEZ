"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials-admin", {
            email,
            password,
            redirect: false,
        });

        if (result?.error || !result?.ok) {
            setError("Email atau password salah.");
            setLoading(false);
            return;
        }

        router.push("/admin");
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#ffeb3b] border-[4px] border-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_white]">
                        <ShieldCheck className="w-9 h-9 text-black" strokeWidth={3} />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Admin</h1>
                    <p className="text-white/40 font-bold text-sm mt-1">Inversave Control Panel</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-white/70 text-xs font-black uppercase tracking-widest block mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@inversave.space"
                            className="w-full bg-white/10 border-[3px] border-white/20 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors placeholder:text-white/30"
                        />
                    </div>

                    <div>
                        <label className="text-white/70 text-xs font-black uppercase tracking-widest block mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-white/10 border-[3px] border-white/20 rounded-xl px-4 py-3 pr-12 text-white font-bold focus:outline-none focus:border-[#ffeb3b] transition-colors placeholder:text-white/30"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border-[2px] border-red-500/50 rounded-xl px-4 py-3">
                            <p className="text-red-400 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ffeb3b] text-black border-[3px] border-white rounded-xl h-12 font-black uppercase tracking-wide hover:bg-[#ffe01a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Masuk...</> : "Masuk ke Admin"}
                    </button>
                </form>
            </div>
        </div>
    );
}
