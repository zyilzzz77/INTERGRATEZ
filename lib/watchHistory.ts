/**
 * Shared helpers for watch history.
 * Tries DB (for logged-in users), falls back to localStorage (for guests).
 */

const LS_KEY_PREFIX = "watchHistory_";

function lsKey(provider: string, dramaId: string) {
    return `${LS_KEY_PREFIX}${provider}_${dramaId}`;
}

/**
 * Load the saved episode number. Returns null if nothing saved.
 */
export async function loadHistory(provider: string, dramaId: string): Promise<number | null> {
    try {
        const res = await fetch(`/api/history?provider=${encodeURIComponent(provider)}&dramaId=${encodeURIComponent(dramaId)}`);
        if (res.ok) {
            const json = await res.json();
            const ep = json.data?.episode ?? json.episode ?? null;
            if (ep !== null && ep !== undefined) return Number(ep);
        }
    } catch {
        // Network error — fall through to localStorage
    }

    // Fallback: localStorage
    try {
        const val = localStorage.getItem(lsKey(provider, dramaId));
        if (val !== null) return Number(val);
    } catch {
        // localStorage unavailable
    }
    return null;
}

/**
 * Save the current episode number.
 * Fire-and-forget: errors are silently ignored.
 */
export function saveHistory(provider: string, dramaId: string, episode: number): void {
    // Always try localStorage first (instant, works for guests)
    try {
        localStorage.setItem(lsKey(provider, dramaId), String(episode));
    } catch {
        // localStorage unavailable
    }

    // Also try DB (async, will silently fail for guests with 401)
    fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, dramaId, episode }),
    }).catch(() => {
        // Silently ignore network errors
    });
}
