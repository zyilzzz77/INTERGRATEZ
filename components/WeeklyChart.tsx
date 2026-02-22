"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

interface DayData {
    label: string;
    count: number;
}

export default function WeeklyChart() {
    const [days, setDays] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/weekly-requests")
            .then((r) => r.json())
            .then((d) => setDays(d.days || []))
            .catch(() => setDays([]))
            .finally(() => setLoading(false));
    }, []);

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    const totalRequests = days.reduce((sum, d) => sum + d.count, 0);

    // Nice Y-axis: round up to nearest multiple of 5 (min 10)
    const yMax = Math.max(Math.ceil(maxCount * 1.2 / 5) * 5, 10);
    const ySteps = 5;
    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(yMax - (yMax / ySteps) * i));

    return (
        <div className="rounded-xl bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                        <BarChart3 className="h-4 w-4 text-teal-500" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">Weekly Requests</h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-1">
                    <TrendingUp className="h-3 w-3 text-teal-500" />
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{totalRequests}</span>
                </div>
            </div>

            {/* Chart Body */}
            <div className="p-4 sm:p-5">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                    </div>
                ) : (
                    <div className="flex gap-2">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between py-1 pr-1 shrink-0" style={{ height: 160 }}>
                            {yLabels.map((v, i) => (
                                <span key={i} className="text-[10px] text-neutral-400 font-mono text-right w-5 leading-none">
                                    {v}
                                </span>
                            ))}
                        </div>

                        {/* Chart area */}
                        <div className="flex-1 flex flex-col">
                            <div className="relative" style={{ height: 160 }}>
                                {/* Horizontal grid lines */}
                                {yLabels.map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute left-0 right-0 border-t border-neutral-200 dark:border-neutral-700/60"
                                        style={{ top: `${(i / ySteps) * 100}%` }}
                                    />
                                ))}

                                {/* Bars + dots rendered as divs for pixel-perfect rendering */}
                                <div className="absolute inset-0 flex items-end justify-between px-1">
                                    {days.map((d, i) => {
                                        const heightPct = (d.count / yMax) * 100;
                                        return (
                                            <div key={i} className="flex flex-col items-center flex-1 relative group">
                                                {/* Tooltip */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                    {d.count} req
                                                </div>
                                                {/* Bar */}
                                                <div
                                                    className="w-5 sm:w-7 rounded-t-md bg-gradient-to-t from-teal-500/20 to-teal-400/40 dark:from-teal-500/15 dark:to-teal-400/30 transition-all duration-500 relative"
                                                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                                                >
                                                    {/* Dot on top */}
                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-teal-500 ring-2 ring-white dark:ring-neutral-900 shadow-sm" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* X-axis labels */}
                            <div className="flex justify-between px-1 mt-2 border-t border-neutral-100 dark:border-neutral-800/70 pt-2">
                                {days.map((d, i) => (
                                    <span key={i} className="text-[10px] sm:text-xs text-neutral-400 font-medium flex-1 text-center">
                                        {d.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
