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
        const playlistUrl = req.nextUrl.searchParams.get("url");
        if (!playlistUrl) {
            return NextResponse.json(
                { error: "Missing playlist URL" },
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

        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const apiUrl = `${NEOXR_BASE}/api/yt-playlist?url=${encodeURIComponent(playlistUrl)}&apikey=${process.env.NEOXR_API_KEY}`;

        const res = await fetch(apiUrl, {
            cache: "no-store",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        if (!res.ok) {
            throw new Error(`Neoxr API ${res.status}`);
        }

        const data = await res.json();

        if (!data.status || !Array.isArray(data.data)) {
            throw new Error("Invalid response from API");
        }

        return NextResponse.json(
            { status: true, data: data.data },
            { headers: CORS }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Gagal mengambil playlist YouTube", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
