import { NextRequest, NextResponse } from "next/server";
import { deductCredit } from "@/lib/credits";

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

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json({ error: "Akses VIP Diperlukan" }, { status: 403, headers: CORS });
        }

        const NEOXR_API_KEY = process.env.NEOXR_API_KEY || "OXlJB9";
        const url = `https://api.neoxr.eu/api/spotify-search?q=${encodeURIComponent(q)}&apikey=${NEOXR_API_KEY}`;

        // Use a proper User-Agent to avoid potential blocks
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Spotify search ${res.status}`);

        const data = await res.json();

        // Neoxr format: { status: true, data: [...] }
        const items = data.status && Array.isArray(data.data) ? data.data : [];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const results = items.map((item: any) => {
            // Neoxr sometimes returns title as "Artist - Title"
            const fullTitle = item.title || "";
            let artistStr = "Unknown Artist";
            let titleStr = fullTitle;

            if (fullTitle.includes(" - ")) {
                const parts = fullTitle.split(" - ");
                artistStr = parts[0].trim();
                titleStr = parts.slice(1).join(" - ").trim();
            }

            return {
                title: titleStr || "Unknown",
                artist: artistStr,
                cover: item.thumbnail || "",
                thumbnail: item.thumbnail || "",
                duration: item.duration || "-",
                url: item.url || "",
                album: "",
                release_date: "",
                popularity: item.popularity || 0,
            };
        });

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
