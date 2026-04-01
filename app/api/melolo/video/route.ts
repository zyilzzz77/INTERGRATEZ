import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const VIDEO_CODE = process.env.DRAMABOS_CODE || "0B758C07EB07771BACB70777A0F4147A";

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    try {
        const vid = req.nextUrl.searchParams.get("vid");
        if (!vid) {
            return NextResponse.json({ status: false, error: "Missing vid parameter" }, { status: 400, headers: CORS });
        }

        const MELOLO_BASE = process.env.MELOLO_API_BASE_URL || "https://melolo.dramabos.my.id";
        const url = `${MELOLO_BASE}/api/video/${vid}?lang=id&code=${VIDEO_CODE}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                // Find best quality video URL
                let videoUrl = raw.url || raw.backup || "";
                const videoList = raw.list || [];

                // Prefer 720p > 540p > 480p > 360p > 240p
                const qualityOrder = ["720p", "540p", "480p", "360p", "240p"];
                for (const quality of qualityOrder) {
                    const found = videoList.find((v: any) => v.definition === quality);
                    if (found) {
                        videoUrl = found.url;
                        break;
                    }
                }

                return NextResponse.json({
                    status: true,
                    data: {
                        url: videoUrl,
                        backup: raw.backup || "",
                        list: videoList,
                    },
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Melolo Video] Attempt ${attempt + 1} failed, retrying...`);
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
