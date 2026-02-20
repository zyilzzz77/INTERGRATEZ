"use client";

import { useEffect, useState, useCallback } from "react";

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
        <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto toast toast-${t.type}`}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}
