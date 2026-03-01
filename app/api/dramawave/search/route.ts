import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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
        const query = req.nextUrl.searchParams.get("q") || "";
        const page = req.nextUrl.searchParams.get("page") || "1";

        if (!query) {
            return NextResponse.json({ error: "Missing query" }, { status: 400, headers: CORS });
        }

        const url = `https://dramawave.dramabos.my.id/api/search?q=${encodeURIComponent(query)}&lang=in&page=${page}`;

        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 10000,
        });

        // The API returns { list: [...] }
        const data = res.data;

        // Process data to match DramaWaveItem format and proxy covers
        if (data && Array.isArray(data.list)) {
            data.list = data.list.map((item: any) => ({
                playlet_id: item.id,
                title: item.name,
                chapterCount: item.episode_count,
                cover: item.cover ? `/api/proxy-image?url=${encodeURIComponent(item.cover)}` : "",
                description: item.desc,
                performers: item.performers,
            }));
        }

        return NextResponse.json(data, { headers: CORS });
    } catch (err: any) {
        console.error("DramaWave search error:", err.message);
        return NextResponse.json({ error: "Gagal melakukan pencarian", detail: err.message }, { status: 500, headers: CORS });
    }
}
