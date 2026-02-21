import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

/** Check if URL belongs to Bilibili's CDN */
function isBilibiliCdn(u: string) {
    return (
        u.includes("akamaized.net") ||
        u.includes("bilibili") ||
        u.includes("bstar") ||
        u.includes("bilivideo")
    );
}

/** Build headers for upstream fetch — special-cases Bilibili CDN */
function buildHeaders(url: string, range?: string, ifRange?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (range) {
        headers["Range"] = range;
    }
    if (ifRange) {
        headers["If-Range"] = ifRange;
    }

    if (isBilibiliCdn(url)) {
        Object.assign(headers, {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://www.bilibili.tv/",
            Origin: "https://www.bilibili.tv",
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "video",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        });
    } else {
        Object.assign(headers, {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: new URL(url).origin,
        });
    }
    
    return headers;
}

/**
 * Proxy download — streams a file from an external CDN and returns it
 * with Content-Disposition: attachment so the browser auto-downloads it.
 *
 * Usage: /api/proxy-download?url=...&filename=video.mp4
 */
async function handleRequest(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    const filename = req.nextUrl.searchParams.get("filename") || "download";

    if (!urlParam) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Try to decode URL properly if it was encoded
    let url = decodeURIComponent(urlParam);

    // If it looks like base64 (no protocol), try to decode
    if (!url.startsWith("http")) {
        try {
            url = atob(url);
        } catch {
            // ignore
        }
    }

    // Sanitize filename to prevent HTTP 500 due to invalid characters in header
    // Remove newlines, carriage returns, and control characters
    const safeFilename = filename.replace(/[\r\n\t\x00-\x1f\x7f]/g, "").trim();

    try {
        const range = req.headers.get("range") || undefined;
        const ifRange = req.headers.get("if-range") || undefined;
        const res = await fetch(url, {
            method: req.method,
            headers: buildHeaders(url, range, ifRange),
            cache: "no-store",
            signal: req.signal,
        });

        if (!res.ok) {
            console.warn(`[Proxy] Upstream ${res.status} for ${url}.`);
            return new NextResponse(res.body, {
                status: res.status,
                statusText: res.statusText,
            });
        }

        let contentType = res.headers.get("content-type") || "application/octet-stream";
        if (url.includes(".m4s")) {
             contentType = "video/mp4";
        }

        const isDownload = req.nextUrl.searchParams.get("download") === "true";
        if (isDownload) {
            contentType = "application/octet-stream";
        }

        const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        };

        if (isDownload) {
            const encodedFilename = encodeURIComponent(safeFilename);
            headers["Content-Disposition"] = `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["Cache-Control"] = "no-store";
            headers["Pragma"] = "no-cache";
        } else {
            headers["Content-Disposition"] = `inline`;
        }
        
        const contentLength = res.headers.get("content-length");
        if (contentLength) {
            headers["Content-Length"] = contentLength;
        }

        const contentRange = res.headers.get("content-range");
        if (contentRange) {
            headers["Content-Range"] = contentRange;
        }
        
        const acceptRanges = res.headers.get("accept-ranges");
        if (acceptRanges) {
            headers["Accept-Ranges"] = acceptRanges;
        }

        return new NextResponse(res.body, { 
            status: res.status, 
            statusText: res.statusText,
            headers 
        });
    } catch (e: any) {
        if (e.name === 'AbortError') {
            return new NextResponse(null, { status: 499 }); // Client Closed Request
        }
        console.error("[Proxy Download Error]", e);
        return NextResponse.json({ error: "Download proxy error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function HEAD(req: NextRequest) {
    return handleRequest(req);
}
