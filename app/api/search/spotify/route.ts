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

        const url = `https://api.nexray.web.id/search/spotify?q=${encodeURIComponent(q)}`;
        // Use a proper User-Agent to avoid potential blocks, though NexRay seems public
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Spotify search ${res.status}`);

        const data = await res.json();

        // NexRay format: { status: true, result: [...] }
        const items = data.status && Array.isArray(data.result) ? data.result : [];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const results = items.map((item: any) => ({
            title: item.title || "Unknown",
            artist: item.artist || "Unknown Artist",
            cover: item.thumbnail || "",
            thumbnail: item.thumbnail || "",
            duration: item.duration || "-",
            url: item.url || "",
            album: item.album || "",
            release_date: item.release_date || "",
            popularity: item.popularity || 0,
        }));

        return NextResponse.json({ items: results }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Spotify search error:", message);
        return NextResponse.json(
            { error: "Gagal mencari lagu Spotify", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
