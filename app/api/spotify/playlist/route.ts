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
        const url = req.nextUrl.searchParams.get("url");
        if (!url) {
            return NextResponse.json({ error: "Missing playlist URL" }, { status: 400, headers: CORS });
        }

        // Validate it's a Spotify playlist URL
        if (!url.includes("open.spotify.com/playlist/")) {
            return NextResponse.json({ error: "URL bukan playlist Spotify yang valid" }, { status: 400, headers: CORS });
        }

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json({ error: "Akses VIP Diperlukan" }, { status: 403, headers: CORS });
        }

        const apiKey = process.env.NEOXR_API_KEY;
        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const apiUrl = `${NEOXR_BASE}/api/spotify?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

        const res = await fetch(apiUrl, { cache: "no-store" });

        if (!res.ok) throw new Error(`Spotify playlist API ${res.status}`);

        const data = await res.json();

        if (!data.status) {
            return NextResponse.json(
                { error: data.message || "Gagal memuat playlist" },
                { status: 500, headers: CORS }
            );
        }

        return NextResponse.json({
            status: true,
            data: data.data || {},
            tracks: data.tracks || [],
        }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Spotify playlist error:", message);
        return NextResponse.json(
            { error: "Gagal memuat playlist Spotify", detail: message },
            { status: 500, headers: CORS },
        );
    }
}
