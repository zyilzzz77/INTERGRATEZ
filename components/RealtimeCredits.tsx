"use client";

import { useState, useEffect } from "react";

export default function RealtimeCredits({ initialCredits }: { initialCredits: number }) {
    const [credits, setCredits] = useState<number>(initialCredits);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const res = await fetch("/api/user/credits");
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
