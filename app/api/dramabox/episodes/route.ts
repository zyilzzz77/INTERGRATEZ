import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const CODE = "0B758C07EB07771BACB70777A0F4147A";

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    const bookId = req.nextUrl.searchParams.get("bookId");

    if (!bookId) {
        return NextResponse.json({ error: "bookId is required" }, { status: 400, headers: CORS });
    }

    try {
        const url = `https://dramabox.dramabos.my.id/api/v1/allepisode?bookId=${bookId}&code=${CODE}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;
                const episodes = Array.isArray(raw) ? raw : [];

                const mappedEpisodes = episodes.map((ep: any) => ({
                    chapterId: ep.chapterId,
                    chapterIndex: ep.chapterIndex,
                    chapterName: ep.chapterName,
                    videoUrl: ep.videoUrl || "",
                }));

                return NextResponse.json({
                    status: true,
                    data: mappedEpisodes,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[DramaBox Episodes] Attempt ${attempt + 1} failed, retrying...`);
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
