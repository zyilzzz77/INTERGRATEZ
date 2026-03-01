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
        const url = `https://dramabox.dramabos.my.id/api/v1/foryou?lang=in`;

        // Retry logic for timeout/network errors
        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000), // 30s, 45s, 60s
                });

                const raw = res.data;

                // Response is a flat array of items
                const records = Array.isArray(raw) ? raw : [];

                const mappedItems = records.map((item: any) => ({
                    id: item.bookId,
                    title: item.bookName,
                    cover: item.coverWap
                        ? `/api/proxy-image?url=${encodeURIComponent(item.coverWap.trim())}`
                        : "",
                    chapterCount: item.chapterCount || 0,
                    introduction: item.introduction || "",
                    tags: (item.tags || []) as string[],
                    playCount: item.playCount || "",
                    corner: item.corner || null,
                    rankVo: item.rankVo || null,
                }));

                return NextResponse.json({
                    status: true,
                    data: mappedItems,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[DramaBox ForYou] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server DramaBox sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message, details: lastError?.response?.data || {} }, { status: 500, headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
