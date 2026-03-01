"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function RealtimeBonus({ initialBonus }: { initialBonus: number }) {
    const [bonus, setBonus] = useState<number>(initialBonus);
    const { data: session } = useSession();
    // Only syncing normal credits on guest sync, but we still poll bonus.

    useEffect(() => {
        const fetchCredits = async () => {
            if (!session?.user) return; // Only users have bonus credits
            try {
                const res = await fetch("/api/user/credits");
                const data = await res.json();
                if (data.bonusCredits !== undefined && data.bonusCredits !== null) {
                    setBonus(data.bonusCredits);
                }
            } catch (error) {
                // Silently ignore polling errors to prevent console spam
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(fetchCredits, 5000);
        return () => clearInterval(interval);
    }, [session]);

    return <span>{bonus.toLocaleString()}</span>;
}
