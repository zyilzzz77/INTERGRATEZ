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
            return NextResponse.json({ error: "Kredit tidak mencukupi" }, { status: 403, headers: CORS });
        }

        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const url = `${NEOXR_BASE}/api/dracin?q=${encodeURIComponent(q)}&apikey=${process.env.NEOXR_API_KEY}`;
        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Dracin search ${res.status}`);

        const data = await res.json();

        const items = data.status && Array.isArray(data.data) ? data.data : [];

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const results = items.map((item: any) => ({
            thumbnail: item.thumbnail || "",
            title: item.title || "Unknown",
            publishYear: item.publishYear || "-",
            director: Array.isArray(item.director) ? item.director.map((d: any) => d.n || "").filter(Boolean) : [],
            cast: Array.isArray(item.cast) ? item.cast.slice(0, 5).map((c: any) => ({
                name: c.n || "",
                photo: c.coverPic || "",
            })) : [],
            episodeCount: Array.isArray(item.episodes) ? item.episodes.filter((e: any) => e.episodeType === 0).length : 0,
            episodes: Array.isArray(item.episodes)
                ? item.episodes
                    .filter((e: any) => e.episodeType === 0)
                    .map((e: any) => ({
                        order: e.order,
                        name: e.name || `Episode ${e.order}`,
                        url: e.url ? (e.url.startsWith("//") ? `https:${e.url}` : e.url) : "",
                        isVip: e.vipInfo?.isVip === 1,
                    }))
                : [],
            url: item.url || "",
        }));

        return NextResponse.json({ items: results }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Dracin search error:", message);
        return NextResponse.json(
            { error: "Gagal mencari drama", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
