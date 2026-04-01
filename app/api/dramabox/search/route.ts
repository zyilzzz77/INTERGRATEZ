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
    const query = req.nextUrl.searchParams.get("query") || "";

    if (!query.trim()) {
        return NextResponse.json({ status: true, data: [] }, { headers: CORS });
    }

    try {
        const DRAMABOX_BASE = process.env.DRAMABOX_API_BASE_URL || "https://dramabox.dramabos.my.id";
        const url = `${DRAMABOX_BASE}/api/v1/search?query=${encodeURIComponent(query)}&lang=in`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;
                const results = Array.isArray(raw) ? raw : [];

                const mappedItems = results.map((item: any) => ({
                    id: item.bookId,
                    title: item.bookName,
                    cover: item.cover
                        ? `/api/proxy-image?url=${encodeURIComponent(item.cover.trim())}`
                        : "",
                    introduction: item.introduction || "",
                    protagonist: item.protagonist || "",
                    tags: (item.tagNames || []) as string[],
                    inLibrary: item.inLibrary || false,
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
                    console.log(`[DramaBox Search] Attempt ${attempt + 1} failed, retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server DramaBox sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message }, { status: 500, headers: CORS });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500, headers: CORS });
    }
}
