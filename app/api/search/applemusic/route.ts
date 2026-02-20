import { NextRequest, NextResponse } from "next/server";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    try {
        const q = req.nextUrl.searchParams.get("q");
        if (!q) {
            return NextResponse.json({ error: "Missing query" }, { status: 400, headers: CORS });
        }

        const url = `https://api.nexray.web.id/search/applemusic?q=${encodeURIComponent(q)}`;
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Apple Music search ${res.status}`);

        const data = await res.json();

        // NexRay format: { status: true, result: [...] }
        const items = data.status && Array.isArray(data.result) ? data.result : [];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const results = items.map((item: any) => {
            // "Song · Dewa 19" -> "Dewa 19"
            let artist = item.subtitle || "Unknown Artist";
            if (artist.includes("·")) {
                artist = artist.split("·")[1].trim();
            }

            return {
                title: item.title || "Unknown",
                artist: artist,
                thumbnail: item.image || "",
                url: item.link || "",
                type: item.subtitle?.split("·")[0]?.trim() || "Song",
            };
        });

        return NextResponse.json({ items: results }, { headers: CORS });
    } catch (err: unknown) {
        console.error("Apple Music Search Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch Apple Music data" },
            { status: 500, headers: CORS }
        );
    }
}
