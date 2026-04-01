import { NextResponse } from "next/server";
import axios from "axios";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET() {
    try {
        const DRAMAWAVE_BASE = process.env.DRAMAWAVE_API_BASE_URL || "https://dramawave.dramabos.my.id";
        const url = `${DRAMAWAVE_BASE}/api/recommend?lang=cn&next=1`;

        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 10000,
        });

        const data = res.data;

        // Process cover images to proxy through our domain to avoid CORS/mixed-content
        if (data && Array.isArray(data.items)) {
            data.items = data.items.map((item: any) => ({
                ...item,
                cover: item.cover ? `/api/proxy-image?url=${encodeURIComponent(item.cover)}` : "",
            }));
        }

        return NextResponse.json(data, { headers: CORS });
    } catch (err: any) {
        console.error("DramaWave recommend error:", err.message);
        return NextResponse.json({ error: "Gagal mengambil rekomendasi", detail: err.message }, { status: 500, headers: CORS });
    }
}
