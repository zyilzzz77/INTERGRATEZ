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
        const limit = req.nextUrl.searchParams.get("limit") || "10";

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json({ error: "Kredit tidak mencukupi" }, { status: 403, headers: CORS });
        }

        const url = `https://api.neoxr.eu/api/spotify-new?limit=${encodeURIComponent(limit)}&apikey=OXlJB9`;
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Spotify new releases ${res.status}`);

        const data = await res.json();

        const items = data.status && Array.isArray(data.data) ? data.data : [];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const results = items.map((item: any) => ({
            thumbnail: item.thumbnail || "",
            name: item.name || "Unknown",
            artist: item.artist || "Unknown Artist",
            release_date: item.release_date || "",
            url: item.url || "",
        }));

        return NextResponse.json({ items: results }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Spotify new releases error:", message);
        return NextResponse.json(
            { error: "Gagal memuat new releases", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
