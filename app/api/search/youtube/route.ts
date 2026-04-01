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
            return NextResponse.json(
                { error: "Missing query" },
                { status: 400, headers: CORS }
            );
        }

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { error: "Kredit tidak mencukupi" },
                { status: 403, headers: CORS }
            );
        }

        const NEOXR_API_KEY = process.env.NEOXR_API_KEY || "OXlJB9";
        const url = `https://api.neoxr.eu/api/yts?q=${encodeURIComponent(q)}&apikey=${NEOXR_API_KEY}`;

        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) {
            throw new Error(`Neoxr API ${res.status}`);
        }

        const data = await res.json();
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const rawItems = Array.isArray(data.data) ? data.data : [];

        // Map to frontend expected format
        const items = rawItems.map((item: any) => ({
            id: item.videoId || "",
            title: item.title || "No Title",
            description: item.description || "",
            thumbnail: item.thumbnail || "", // Neoxr uses thumbnail
            channel: item.author?.name || "Unknown Channel",
            publishedAt: item.ago || "",
            views: item.views || "",
            duration: item.timestamp || item.duration?.timestamp || "",
            url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
        }));

        return NextResponse.json({ items }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Gagal mencari video YouTube", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
