import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q");
    if (!q) {
        return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    try {
        const apiUrl =
            "https://api.nexray.web.id/search/bilibili?q=" +
            encodeURIComponent(q);

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Bilibili search API error " + res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        if (!data.status || !data.result) {
            return NextResponse.json({ items: [] });
        }

        // Fix doubled domain: "https://www.bilibili.tv//www.bilibili.tv/id/..."
        // → "https://www.bilibili.tv/id/..."
        function fixBiliUrl(url: string) {
            if (!url) return "";
            return url.replace(/(https?:\/\/www\.bilibili\.tv)\/\/www\.bilibili\.tv/, "$1");
        }

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const items = data.result.map((r: any) => ({
            title: r.title || "",
            views: r.views || "",
            author: r.author || "",
            creatorUrl: obfuscate(fixBiliUrl(r.creator_url)),
            duration: r.duration || "",
            thumbnail: r.thumbnail || "",
            videoUrl: fixBiliUrl(r.video_url),
        }));

        return NextResponse.json({ items });
    } catch (err) {
        console.error("[Bilibili Search]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
