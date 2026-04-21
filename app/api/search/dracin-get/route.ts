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
        const dramaUrl = req.nextUrl.searchParams.get("url");
        if (!dramaUrl) {
            return NextResponse.json({ error: "Missing url" }, { status: 400, headers: CORS });
        }

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json({ error: "Akses VIP Diperlukan" }, { status: 403, headers: CORS });
        }

        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const apiUrl = `${NEOXR_BASE}/api/dracin-get?url=${encodeURIComponent(dramaUrl)}&apikey=${process.env.NEOXR_API_KEY}`;
        const res = await fetch(apiUrl, {
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) throw new Error(`Dracin-get ${res.status}`);

        const json = await res.json();

        if (!json.status || !json.data) {
            return NextResponse.json({ error: "Drama tidak ditemukan" }, { status: 404, headers: CORS });
        }

        const d = json.data;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const result = {
            thumbnail: d.thumbnail || "",
            title: d.title || "Unknown",
            year: d.year || "-",
            rating: d.rating || "",
            type: d.type || "",
            place: Array.isArray(d.place) ? d.place.map((p: any) => p.name).filter(Boolean) : [],
            director: Array.isArray(d.director) ? d.director.map((dir: any) => dir.name).filter(Boolean) : [],
            cast: Array.isArray(d.cast) ? d.cast.map((c: any) => ({
                name: c.name || "",
                photo: c.coverPic || c.headPic || "",
            })) : [],
            episodes: Array.isArray(d.episodes) ? d.episodes.map((ep: any, i: number) => ({
                order: i + 1,
                title: ep.title || `Episode ${i + 1}`,
                vip: ep.vip === true,
                url: ep.url || "",
            })) : [],
            playUrl: d.playUrl || "",
        };

        return NextResponse.json({ status: true, data: result }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Dracin-get error:", message);
        return NextResponse.json(
            { error: "Gagal memuat detail drama", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
