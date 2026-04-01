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
        const slug = req.nextUrl.searchParams.get("slug");
        const id = req.nextUrl.searchParams.get("id");

        if (!slug || !id) {
            return NextResponse.json({ error: "Missing slug or id" }, { status: 400, headers: CORS });
        }

        const STARDUSTTV_BASE = process.env.STARDUSTTV_API_BASE_URL || "https://stardusttv.dramabos.my.id";
        const DRAMABOS_CODE = process.env.DRAMABOS_CODE || "0B758C07EB07771BACB70777A0F4147A";
        const url = `${STARDUSTTV_BASE}/v1/detail/${encodeURIComponent(slug)}/${encodeURIComponent(id)}?lang=id&code=${DRAMABOS_CODE}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const data = res.data;

                // Proxy poster image URL
                if (data?.data?.poster) {
                    data.data.poster = `/api/proxy-image?url=${encodeURIComponent(data.data.poster.trim())}`;
                }

                // Strip episode streams from detail response (fetched separately via /api/stardusttv/episode)
                if (data?.data?.episodes) {
                    delete data.data.episodes;
                }

                return NextResponse.json(data, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[StardustTV Detail] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
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
        console.error("StardustTV detail error:", message);
        return NextResponse.json({ error: "Gagal memuat detail drama", detail: message }, { status: 500, headers: CORS });
    }
}
