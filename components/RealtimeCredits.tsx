"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function RealtimeCredits({ initialCredits }: { initialCredits: number }) {
    const [credits, setCredits] = useState<number>(initialCredits);
    const { data: session } = useSession();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Sync guest credits to user account after login (once)
        if (session?.user && !hasSynced.current) {
            hasSynced.current = true;
            fetch("/api/user/sync-credits", { method: "POST" })
                .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
                .then((data) => {
                    if (data.synced && data.credits !== undefined) {
                        setCredits(data.credits);
                    }
                })
                .catch(() => { });
        }
    }, [session]);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch("/api/user/credits");
                if (!res.ok) return;
                const data = await res.json();
                if (data.credits !== undefined && data.credits !== null) {
                    setCredits(data.credits);
                }
            } catch (error) {
                // Silently ignore polling errors to prevent console spam
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(fetchCredits, 5000);
        return () => clearInterval(interval);
    }, []);

    return <span>{credits.toLocaleString()}</span>;
}
