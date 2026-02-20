import { NextRequest, NextResponse } from "next/server";

function isBilibiliImage(u: string) {
    return u.includes("bstarstatic") || u.includes("bilibili") || u.includes("hdslb");
}

/**
 * Proxy external images to avoid CORS / referrer-policy issues
 * Usage: /api/proxy-image?url=https://example.com/image.jpg
 */
export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    if (!urlParam) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Try to decode URL properly if it was encoded
    let url = decodeURIComponent(urlParam);

    // If it looks like base64 (no protocol), try to decode
    if (!url.startsWith("http")) {
        try {
            url = Buffer.from(url, 'base64').toString('utf-8');
        } catch {
            // ignore
        }
    }

    try {
        const referer = isBilibiliImage(url) ? "https://www.bilibili.tv/" : new URL(url).origin;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: referer,
                Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Image fetch failed" }, { status: res.status });
        }

        const contentType = res.headers.get("content-type") || "image/jpeg";
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}
