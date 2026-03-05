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
        const q = req.nextUrl.searchParams.get("q");

        if (!q) {
            return NextResponse.json({ error: "Missing query" }, { status: 400, headers: CORS });
        }

        const url = `https://stardusttv.dramabos.my.id/v1/find?q=${encodeURIComponent(q)}&lang=id`;

        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 15000,
        });

        const data = res.data;

        // Proxy poster image URLs
        if (data?.data && Array.isArray(data.data)) {
            data.data = data.data.map((item: any) => ({
                ...item,
                poster: item.poster
                    ? `/api/proxy-image?url=${encodeURIComponent(item.poster.trim())}`
                    : item.poster,
            }));
        }

        return NextResponse.json(data, { headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        console.error("StardustTV search error:", message);
        return NextResponse.json({ error: "Gagal mencari drama", detail: message }, { status: 500, headers: CORS });
    }
}
