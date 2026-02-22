"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export default function UserIpDisplay() {
    const [ip, setIp] = useState<string>("Detecting...");

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const res = await fetch("/api/ip");
                const data = await res.json();
                if (data.ip) {
                    setIp(data.ip);
                } else {
                    setIp("Unknown");
                }
            } catch (error) {
                console.error("Failed to fetch IP:", error);
                setIp("Failed to detect");
            }
        };

        fetchIp();
    }, []);

    return (
        <div className="flex items-center gap-3 sm:gap-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 sm:p-4 ring-1 ring-neutral-100 dark:ring-neutral-800">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-neutral-500">IP Address</p>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate font-mono tracking-wider">
                    {ip}
                </p>
            </div>
        </div>
    );
}
