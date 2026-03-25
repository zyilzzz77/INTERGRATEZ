"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    const activeMessages = useRef<Set<string>>(new Set());
    const typeConfig = {
        success: {
            icon: CheckCircle2,
            containerBg: "bg-[#a0d1d6]", // Pastel blue
            iconBg: "bg-white",
            iconColor: "text-emerald-600",
            bar: "bg-black",
            label: "Success",
        },
        error: {
            icon: AlertTriangle,
            containerBg: "bg-[#ffb3c6]", // Pastel pink
            iconBg: "bg-white",
            iconColor: "text-red-600",
            bar: "bg-black",
            label: "Error",
        },
        info: {
            icon: Info,
            containerBg: "bg-[#ffeb3b]", // Solid yellow
            iconBg: "bg-white",
            iconColor: "text-blue-600",
            bar: "bg-black",
            label: "Info",
        },
    };

    const add = useCallback((message: string, type: ToastItem["type"] = "info") => {
        if (activeMessages.current.has(message)) return;
        activeMessages.current.add(message);

        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            activeMessages.current.delete(message);
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3100);
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
                                className={`pointer-events-auto relative w-[320px] overflow-hidden rounded-xl border-[3px] border-black ${cfg.containerBg} shadow-neo-sm`}
                            >
                                <div className="flex items-start gap-3 p-4">
                                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-black ${cfg.iconBg} shadow-neo-sm`}>
                                        <Icon className={`h-5 w-5 ${cfg.iconColor}`} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="text-[11px] font-black uppercase tracking-wider text-black/70">
                                                {cfg.label}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    activeMessages.current.delete(t.message);
                                                    setToasts(prev => prev.filter(item => item.id !== t.id));
                                                }}
                                                className="text-black/50 hover:text-black transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="mt-0.5 text-sm font-bold text-black break-words">
                                            {t.message}
                                        </div>
                                    </div>
                                </div>
                                <m.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 3.1, ease: "linear" }}
                                    className={`h-[4px] ${cfg.bar}`}
                                />
                            </m.div>
                        );
                    })}
                </AnimatePresence>
            </LazyMotion>
        </div>
    );
}
