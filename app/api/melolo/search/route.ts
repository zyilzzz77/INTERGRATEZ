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
        if (!query.trim()) {
            return NextResponse.json({ status: true, data: [], count: 0 }, { headers: CORS });
        }

        const url = `https://melolo.dramabos.my.id/api/search?lang=id&q=${encodeURIComponent(query)}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (raw.code !== 0 || !Array.isArray(raw.data)) {
                    return NextResponse.json({
                        status: false,
                        error: "Invalid API response",
                        data: [],
                    }, { headers: CORS });
                }

                const mappedItems = raw.data.map((item: any) => ({
                    id: item.id,
                    title: item.name,
                    cover: item.cover
                        ? `/api/proxy-image?url=${encodeURIComponent(item.cover.trim())}`
                        : "",
                    abstract: item.intro || "",
                    episodeCount: item.episodes || 0,
                    author: item.author || "",
                }));

                return NextResponse.json({
                    status: true,
                    data: mappedItems,
                    count: raw.count || mappedItems.length,
                    hasMore: raw.has_more ?? false,
                    query: raw.query || query,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Melolo Search] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server Melolo sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message }, { status: 500, headers: CORS });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500, headers: CORS });
    }
}
