import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

function sanitizeCoverUrl(rawUrl: string): string {
    try {
        return new URL(rawUrl.trim()).href;
    } catch {
        return rawUrl.trim();
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ status: false, error: "Missing id" }, { status: 400, headers: CORS });
        }

        const url = `https://netshort.dramabos.my.id/api/drama/${id}?lang=in`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (!raw.shortPlayId) {
                    return NextResponse.json({
                        status: false,
                        error: "Invalid API response",
                    }, { headers: CORS });
                }

                const detail = {
                    id: raw.shortPlayId,
                    libraryId: raw.shortPlayLibraryId,
                    title: (raw.shortPlayName || "").trim(),
                    cover: raw.shortPlayCover ? sanitizeCoverUrl(raw.shortPlayCover) : "",
                    synopsis: raw.shotIntroduce || "",
                    totalEpisode: raw.totalEpisode || 0,
                    tags: raw.shortPlayLabels || [],
                    isFinish: raw.isFinish === 1,
                    isNew: raw.isNewLabel ?? false,
                    scriptName: raw.scriptName || "",
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
                    console.log(`[Netshort Detail] Attempt ${attempt + 1} failed, retrying...`);
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
