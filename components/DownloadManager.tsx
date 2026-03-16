"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
    Download, CheckCircle2, XCircle, ChevronDown, ChevronUp, X,
} from "lucide-react";
import {
    subscribe, getDownloads, removeDownload, clearFinished,
    type DownloadItem,
} from "@/lib/downloadStore";

function useDownloads() {
    return useSyncExternalStore(subscribe, getDownloads, getDownloads);
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function DownloadManager() {
    const downloads = useDownloads();
    const [collapsed, setCollapsed] = useState(false);

    if (downloads.length === 0) return null;

    const active = downloads.filter((d) => d.status === "downloading").length;
    const done = downloads.filter((d) => d.status === "done").length;

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.95 }}
                className="fixed bottom-5 left-5 z-[9998] w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-500/30">
                            <Download className="h-3.5 w-3.5 text-sky-300" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-white">
                                Download{" "}
                            </span>
                            <span className="text-[10px] text-white/50">
                                {active > 0 ? `${active} aktif` : ""}
                                {active > 0 && done > 0 ? " · " : ""}
                                {done > 0 ? `${done} selesai` : ""}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {done > 0 && (
                            <button
                                onClick={clearFinished}
                                className="rounded-lg px-2 py-1 text-[10px] font-bold text-white/40 transition hover:bg-white/5 hover:text-white/70"
                                title="Hapus selesai"
                            >
                                Hapus
                            </button>
                        )}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="rounded-lg p-1 text-white/40 transition hover:bg-white/5 hover:text-white/70"
                        >
                            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Items */}
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="max-h-[280px] overflow-y-auto overflow-x-hidden"
                        >
                            <div className="flex flex-col gap-0.5 p-2">
                                <AnimatePresence initial={false}>
                                    {downloads.map((d) => (
                                        <DownloadRow key={d.id} item={d} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </m.div>
        </LazyMotion>
    );
}

function DownloadRow({ item }: { item: DownloadItem }) {
    const isActive = item.status === "downloading";
    const isDone = item.status === "done";
    const isError = item.status === "error";

    // Elapsed seconds for connecting state
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!isActive) return;
        const t = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => {
            clearInterval(t);
            setElapsed(0);
        };
    }, [isActive]);

    // Truncate filename for display
    const displayName =
        item.filename.length > 32
            ? item.filename.slice(0, 28) + "..." + item.filename.slice(item.filename.lastIndexOf("."))
            : item.filename;

    return (
        <m.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`relative overflow-hidden rounded-xl px-3 py-2.5 transition-colors ${isDone ? "bg-emerald-500/5" : isError ? "bg-rose-500/5" : "bg-white/[0.03]"
                }`}
        >
            <div className="flex items-center gap-2.5">
                {/* Icon */}
                <div className="shrink-0">
                    {isActive && (
                        <div className="relative flex h-6 w-6 items-center justify-center">
                            <div className="absolute inset-0 animate-ping rounded-full bg-sky-400/20" />
                            <Download className="h-3.5 w-3.5 text-sky-400" />
                        </div>
                    )}
                    {isDone && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {isError && <XCircle className="h-5 w-5 text-rose-400" />}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white/90" title={item.filename}>
                        {displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
                        {isActive && item.total > 0 && (
                            <>
                                <span>{formatBytes(item.loaded)} / {formatBytes(item.total)}</span>
                                <span>· {item.progress}%</span>
                            </>
                        )}
                        {isActive && item.total === 0 && (
                            <span>{item.loaded > 0 ? formatBytes(item.loaded) : `Mempersiapkan... ${elapsed}d`}</span>
                        )}
                        {isDone && <span className="text-emerald-400/70">Selesai</span>}
                        {isError && <span className="text-rose-400/70">Gagal</span>}
                    </div>
                </div>

                {/* Remove button */}
                {(isDone || isError) && (
                    <button
                        onClick={() => removeDownload(item.id)}
                        className="shrink-0 rounded-md p-1 text-white/30 transition hover:bg-white/5 hover:text-white/60"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Progress bar */}
            {isActive && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <m.div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: item.total > 0 ? `${item.progress}%` : "100%" }}
                        transition={
                            item.total > 0
                                ? { duration: 0.3, ease: "easeOut" }
                                : { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                        }
                        style={item.total === 0 ? { opacity: 0.4 } : undefined}
                    />
                </div>
            )}
        </m.div>
    );
}
