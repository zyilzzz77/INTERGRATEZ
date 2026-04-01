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
        const STARDUSTTV_BASE = process.env.STARDUSTTV_API_BASE_URL || "https://stardusttv.dramabos.my.id";
        const url = `${STARDUSTTV_BASE}/v1/list?lang=id`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const data = res.data;

                // Proxy poster image URLs through /api/proxy-image for faster & more reliable loading
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
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[StardustTV Home] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server StardustTV sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message, details: lastError?.response?.data || {} }, { status: 500, headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
