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
        const apikey = process.env.TAKO_API_KEY || "OXlJB9";
        const q = req.nextUrl.searchParams.get("q");

        let url: string;
        if (q) {
            // Search
            url = `https://api.neoxr.eu/api/dramabox?q=${encodeURIComponent(q)}&apikey=${apikey}`;
        } else {
            // Trending
            url = `https://api.neoxr.eu/api/dramabox-trending?apikey=${apikey}`;
        }

        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 10000,
        });

        return NextResponse.json(res.data, { headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
