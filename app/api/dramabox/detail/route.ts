import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const CODE = process.env.DRAMABOS_CODE || "0B758C07EB07771BACB70777A0F4147A";

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    const bookId = req.nextUrl.searchParams.get("bookId");

    if (!bookId) {
        return NextResponse.json({ error: "bookId is required" }, { status: 400, headers: CORS });
    }

    try {
        const DRAMABOX_BASE = process.env.DRAMABOX_API_BASE_URL || "https://dramabox.dramabos.my.id";
        const url = `${DRAMABOX_BASE}/api/v1/detail?bookId=${bookId}&lang=in&code=${CODE}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                const detail = {
                    id: raw.bookId,
                    title: raw.bookName,
                    cover: raw.coverWap
                        ? `/api/proxy-image?url=${encodeURIComponent(raw.coverWap.trim())}`
                        : "",
                    coverOriginal: raw.coverWap || "",
                    chapterCount: raw.chapterCount || 0,
                    introduction: raw.introduction || "",
                    tags: (raw.tags || []) as string[],
                    playCount: raw.playCount || "",
                    corner: raw.corner || null,
                    shelfTime: raw.shelfTime || "",
                    inLibrary: raw.inLibrary || false,
                };

                return NextResponse.json({
                    status: true,
                    data: detail,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[DramaBox Detail] Attempt ${attempt + 1} failed, retrying...`);
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
