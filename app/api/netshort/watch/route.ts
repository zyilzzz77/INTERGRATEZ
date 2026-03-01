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
        const ep = req.nextUrl.searchParams.get("ep") || "1";

        if (!id) {
            return NextResponse.json({ status: false, error: "Missing id" }, { status: 400, headers: CORS });
        }

        const url = `https://netshort.dramabos.my.id/api/watch/${id}/${ep}?lang=in&code=0B758C07EB07771BACB70777A0F4147A`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (!raw.success || !raw.data) {
                    return NextResponse.json({
                        status: false,
                        error: "Video not available",
                    }, { headers: CORS });
                }

                const data = raw.data;

                return NextResponse.json({
                    status: true,
                    data: {
                        videoUrl: data.videoUrl || "",
                        subtitles: data.subtitles || [],
                        currentEp: data.current || parseInt(ep, 10),
                        maxEps: data.maxEps || 0,
                    },
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Netshort Watch] Attempt ${attempt + 1} failed, retrying...`);
                    continue;
                }
                break;
            }
        }

        const message = lastError?.message || "Unknown error";
        return NextResponse.json({ error: message }, { status: 500, headers: CORS });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500, headers: CORS });
    }
}
