"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

interface ToastItem {
    id: number;
    message: string;
    type: "error" | "success" | "info";
}

let addToastGlobal: ((msg: string, type?: ToastItem["type"]) => void) | null = null;

/** Call from anywhere: showToast("message","error"|"success"|"info") */
export function showToast(message: string, type: ToastItem["type"] = "info") {
    addToastGlobal?.(message, type);
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const typeConfig = {
        success: {
            icon: CheckCircle2,
            ring: "ring-emerald-500/30",
            iconBg: "bg-emerald-500/15",
            iconColor: "text-emerald-200",
            glow: "bg-emerald-500/20",
            bar: "bg-emerald-400/70",
            label: "Success",
        },
        error: {
            icon: AlertTriangle,
            ring: "ring-rose-500/30",
            iconBg: "bg-rose-500/15",
            iconColor: "text-rose-200",
            glow: "bg-rose-500/20",
            bar: "bg-rose-400/70",
            label: "Error",
        },
        info: {
            icon: Info,
            ring: "ring-sky-500/30",
            iconBg: "bg-sky-500/15",
            iconColor: "text-sky-200",
            glow: "bg-sky-500/20",
            bar: "bg-sky-400/70",
            label: "Info",
        },
    };

    const add = useCallback((message: string, type: ToastItem["type"] = "info") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3100);
    }, []);

    useEffect(() => {
        addToastGlobal = add;
        return () => {
            addToastGlobal = null;
        };
    }, [add]);

    return (
        <div className="pointer-events-none fixed top-5 right-5 z-[9999] flex flex-col gap-2">
            <LazyMotion features={domAnimation}>
                <AnimatePresence initial={false}>
                    {toasts.map((t) => {
                        const cfg = typeConfig[t.type as keyof typeof typeConfig];
                        const Icon = cfg.icon;
                        return (
                            <m.div
                                key={t.id}
                                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                className={`pointer-events-auto relative w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-lg ${cfg.ring}`}
                            >
                                <div className={`absolute inset-0 -z-10 opacity-30 blur-2xl ${cfg.glow}`} />
                                <div className="flex items-start gap-3 p-4">
                                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${cfg.iconBg} ${cfg.ring}`}>
                                        <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                                                {cfg.label}
                                            </div>
                                            <button 
                                                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="mt-0.5 text-sm font-semibold text-white break-words">
                                            {t.message}
                                        </div>
                                    </div>
                                </div>
                                <m.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 3.1, ease: "linear" }}
                                    className={`h-0.5 ${cfg.bar}`}
                                />
                            </m.div>
                        );
                    })}
                </AnimatePresence>
            </LazyMotion>
        </div>
    );
}
