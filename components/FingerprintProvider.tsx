"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const FingerprintContext = createContext<string | null>(null);

/**
 * Generate a device fingerprint from browser properties.
 * This is a lightweight alternative to FingerprintJS library.
 */
async function generateFingerprint(): Promise<string> {
    const components = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}x${screen.colorDepth}`,
        `${screen.availWidth}x${screen.availHeight}`,
        navigator.hardwareConcurrency?.toString() || "0",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.maxTouchPoints?.toString() || "0",
        (navigator as any).deviceMemory?.toString() || "0",
        navigator.platform || "",
    ];

    const raw = components.join("|");

    // Hash using SubtleCrypto (SHA-256)
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
    } catch {
        // Fallback: simple hash
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash + char) | 0;
        }
        return Math.abs(hash).toString(16).padStart(8, "0");
    }
}

const COOKIE_NAME = "x-fingerprint";

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? match[1] : null;
}

export function FingerprintProvider({ children }: { children: ReactNode }) {
    const [fingerprint, setFingerprint] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            // Check localStorage first for consistency
            let fp = localStorage.getItem("device_fp");

            if (!fp) {
                fp = await generateFingerprint();
                localStorage.setItem("device_fp", fp);
            }

            // Also set as cookie so middleware can forward it
            const existing = getCookie(COOKIE_NAME);
            if (existing !== fp) {
                setCookie(COOKIE_NAME, fp, 365);
            }

            setFingerprint(fp);
        })();
    }, []);

    return (
        <FingerprintContext.Provider value={fingerprint}>
            {children}
        </FingerprintContext.Provider>
    );
}

export function useFingerprint() {
    return useContext(FingerprintContext);
}
