import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Range",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400, headers: CORS });
    }

    try {
        const headers: Record<string, string> = {
            "User-Agent": UA,
            "Referer": "https://www.pinterest.com/",
            "Origin": "https://www.pinterest.com",
            "Accept": "*/*",
        };

        // Forward Range header for segment requests
        const rangeHeader = req.headers.get("range");
        if (rangeHeader) {
            headers["Range"] = rangeHeader;
        }

        const response = await fetch(url, { headers });

        if (!response.ok && response.status !== 206) {
            return new NextResponse(`Upstream error: ${response.status}`, { status: response.status, headers: CORS });
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const body = await response.arrayBuffer();

        // If it's an m3u8 playlist, rewrite segment URLs to go through this proxy
        if (url.endsWith(".m3u8") || contentType.includes("mpegurl")) {
            const text = new TextDecoder().decode(body);

            // Rewrite relative segment URLs to absolute proxied URLs
            // Match lines that are segment filenames (not starting with #)
            const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
            const lines = text.split("\n");
            const rewritten = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                    // It's a segment or sub-playlist reference
                    let absoluteUrl: string;
                    if (trimmed.startsWith("http")) {
                        absoluteUrl = trimmed;
                    } else {
                        absoluteUrl = baseUrl + trimmed;
                    }
                    return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
                }
                // Also handle URI= in EXT-X-MAP or EXT-X-MEDIA
                if (trimmed.includes('URI="')) {
                    return trimmed.replace(/URI="([^"]+)"/g, (_match, uri) => {
                        let absoluteUri: string;
                        if (uri.startsWith("http")) {
                            absoluteUri = uri;
                        } else {
                            absoluteUri = baseUrl + uri;
                        }
                        return `URI="/api/hls-proxy?url=${encodeURIComponent(absoluteUri)}"`;
                    });
                }
                return line;
            });

            return new NextResponse(rewritten.join("\n"), {
                status: 200,
                headers: {
                    ...CORS,
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // For .ts segments and other binary data, stream through directly
        const resHeaders: Record<string, string> = {
            ...CORS,
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
        };

        const contentLength = response.headers.get("content-length");
        if (contentLength) resHeaders["Content-Length"] = contentLength;

        const contentRange = response.headers.get("content-range");
        if (contentRange) resHeaders["Content-Range"] = contentRange;

        return new NextResponse(body, {
            status: response.status,
            headers: resHeaders,
        });

    } catch (error) {
        console.error("HLS Proxy Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return new NextResponse(`Proxy error: ${message}`, { status: 500, headers: CORS });
    }
}
