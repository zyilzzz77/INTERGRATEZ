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
        const id = req.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ status: false, error: "Missing id parameter" }, { status: 400, headers: CORS });
        }

        const url = `https://melolo.dramabos.my.id/api/detail/${id}?lang=id`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (raw.code !== 0) {
                    return NextResponse.json({ status: false, error: "Invalid API response" }, { headers: CORS });
                }

                return NextResponse.json({
                    status: true,
                    data: {
                        id: raw.id,
                        title: raw.title,
                        cover: raw.cover
                            ? `/api/proxy-image?url=${encodeURIComponent(raw.cover.trim())}`
                            : "",
                        coverOriginal: raw.cover || "",
                        introduction: raw.intro || "",
                        episodes: raw.episodes || 0,
                        videos: (raw.videos || []).map((v: any) => ({
                            vid: v.vid,
                            episode: v.episode,
                            duration: v.duration,
                        })),
                    },
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Melolo Detail] Attempt ${attempt + 1} failed, retrying...`);
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
