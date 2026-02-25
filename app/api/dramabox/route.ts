import { NextRequest, NextResponse } from "next/server";
import { deductCredit } from "@/lib/credits";
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
        const id = req.nextUrl.searchParams.get("id");
        const uri = req.nextUrl.searchParams.get("uri");
        const isRefresh = req.nextUrl.searchParams.get("isRefresh") === "true";

        if (!id || !uri) {
            return NextResponse.json({ error: "Missing id or uri" }, { status: 400, headers: CORS });
        }

        // Deduct credit only if it's NOT a background token refresh
        if (!isRefresh) {
            const canAfford = await deductCredit();
            if (!canAfford) {
                return NextResponse.json({ error: "Kredit tidak mencukupi. Silakan top up." }, { status: 403, headers: CORS });
            }
        }

        const apikey = process.env.TAKO_API_KEY;
        const url = `https://api.neoxr.eu/api/dramabox-get-v2?id=${encodeURIComponent(id)}&uri=${encodeURIComponent(uri)}&apikey=${apikey}`;

        // Retry logic for timeout/network errors
        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000), // 30s, 45s, 60s
                });
                return NextResponse.json(res.data, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[DramaBox] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server DramaBox sedang lambat, silakan coba lagi nanti."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message, details: lastError?.response?.data || {} }, { status: 500, headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
