import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    try {
        const apiUrl =
            "https://api.nexray.web.id/downloader/bilibili?url=" +
            encodeURIComponent(url);

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Bilibili downloader API error " + res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        if (!data.status || !data.result) {
            return NextResponse.json(
                { error: "Failed to fetch video info" },
                { status: 404 }
            );
        }

        const r = data.result;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        return NextResponse.json({
            title: r.title || "",
            thumbnail: r.thumbnail || "",
            views: r.views || "",
            likes: r.like || "0",
            comments: r.comments || "0",
            quality: r.quality || "",
            size: r.size || "",
            directUrl: obfuscate(r.direct_url || r.url || ""),
            media: (r.media || []).map((m: any) => ({
                quality: m.quality || "",
                url: obfuscate(m.url || ""),
                size: m.size || "",
            })),
            audio: (r.audio || []).map((a: any) => ({
                url: obfuscate(a.url || ""),
                size: a.size || "",
            })),
        });
    } catch (err) {
        console.error("[Bilibili Downloader]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
