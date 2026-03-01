import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/* ── In-memory image cache ───────────────────────────────────────── */
interface CacheEntry {
    buffer: ArrayBuffer;
    contentType: string;
    timestamp: number;
}

const IMAGE_CACHE = new Map<string, CacheEntry>();
const CACHE_MAX_ENTRIES = 200;
const CACHE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cacheBytes = 0;

function evictCache() {
    // Remove expired entries first
    const now = Date.now();
    for (const [key, entry] of IMAGE_CACHE) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            cacheBytes -= entry.buffer.byteLength;
            IMAGE_CACHE.delete(key);
        }
    }
    // If still over limits, remove oldest entries
    while (IMAGE_CACHE.size > CACHE_MAX_ENTRIES || cacheBytes > CACHE_MAX_BYTES) {
        const oldestKey = IMAGE_CACHE.keys().next().value;
        if (!oldestKey) break;
        const entry = IMAGE_CACHE.get(oldestKey)!;
        cacheBytes -= entry.buffer.byteLength;
        IMAGE_CACHE.delete(oldestKey);
    }
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function isBilibiliImage(u: string) {
    return u.includes("bstarstatic") || u.includes("bilibili") || u.includes("hdslb");
}

function isPinterestImage(u: string) {
    return u.includes("pinimg") || u.includes("pinterest");
}

function isNetshortImage(u: string) {
    return u.includes("awscover.netshort.com") || u.includes("netshort.com");
}

/**
 * Proxy external images to avoid CORS / referrer-policy issues.
 * Features: in-memory cache, 10 s timeout, long browser cache.
 * Usage: /api/proxy-image?url=https://example.com/image.jpg
 */
export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    if (!urlParam) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Try to decode URL properly if it was encoded
    let url = urlParam; // searchParams.get already decodes once

    // If it looks like base64 (no protocol), try to decode
    if (!url.startsWith("http")) {
        try {
            if (url.includes("%")) {
                url = decodeURIComponent(url);
            } else {
                const decoded = Buffer.from(url, "base64").toString("utf-8");
                if (decoded.startsWith("http")) {
                    url = decoded;
                }
            }
        } catch {
            // ignore
        }
    }

    /* ── Serve from in-memory cache if available ── */
    const cached = IMAGE_CACHE.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return new NextResponse(cached.buffer, {
            headers: {
                "Content-Type": cached.contentType,
                "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
                "Access-Control-Allow-Origin": "*",
                "X-Cache": "HIT",
            },
        });
    }

    /* ── Fetch from origin ── */
    try {
        // Normalize URL to properly encode non-ASCII chars (e.g. Chinese 比)
        let fetchUrl = url;
        try {
            fetchUrl = new URL(url).href;
        } catch {
            // keep original if URL constructor fails
        }

        const referer = isPinterestImage(url)
            ? "https://www.pinterest.com/"
            : isBilibiliImage(url)
                ? "https://www.bilibili.tv/"
                : isNetshortImage(url)
                    ? "https://netshort.com/"
                    : new URL(fetchUrl).origin;

        const origin = new URL(referer).origin;

        const res = await fetch(fetchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: referer,
                Origin: origin,
                "Sec-Fetch-Dest": "image",
                "Sec-Fetch-Mode": "no-cors",
                "Sec-Fetch-Site": "cross-site",
                Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
            },
            signal: AbortSignal.timeout(10_000), // 10 s timeout
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Image fetch failed" }, { status: res.status });
        }

        const contentType = res.headers.get("content-type") || "image/jpeg";
        const buffer = await res.arrayBuffer();

        /* ── Store in cache ── */
        cacheBytes += buffer.byteLength;
        IMAGE_CACHE.set(url, { buffer, contentType, timestamp: Date.now() });
        evictCache();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
                "Access-Control-Allow-Origin": "*",
                "X-Cache": "MISS",
            },
        });
    } catch {
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}
