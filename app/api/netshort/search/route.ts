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
        const q = req.nextUrl.searchParams.get("q");
        const page = req.nextUrl.searchParams.get("page") || "1";

        if (!q) {
            return NextResponse.json({ status: false, error: "Missing query" }, { status: 400, headers: CORS });
        }

        const NETSHORT_BASE = process.env.NETSHORT_API_BASE_URL || "https://netshort.dramabos.my.id";
        const url = `${NETSHORT_BASE}/api/search?lang=in&q=${encodeURIComponent(q)}&page=${page}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (raw.code !== 200 || !raw.data?.searchCodeSearchResult) {
                    return NextResponse.json({
                        status: true,
                        data: [],
                        total: 0,
                    }, { headers: CORS });
                }

                const results = raw.data.searchCodeSearchResult;

                const mappedItems = results.map((item: any) => ({
                    id: item.shortPlayId,
                    libraryId: item.shortPlayLibraryId,
                    title: (item.shortPlayName || "").replace(/<\/?em>/g, "").trim(),
                    cover: item.shortPlayCover ? sanitizeCoverUrl(item.shortPlayCover) : "",
                    tags: (item.labelNameList || []).map((t: string) => t.replace(/<\/?em>/g, "")),
                    heatScore: item.formatHeatScore || "",
                    starMessage: item.starMessage || "",
                    isNew: item.isNewLabel === true,
                    scriptName: item.scriptName || "",
                    actors: (item.actorList || []).map((a: any) => ({
                        name: a.name,
                        role: a.role,
                    })),
                }));

                return NextResponse.json({
                    status: true,
                    data: mappedItems,
                    total: raw.data.total || 0,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Netshort Search] Attempt ${attempt + 1} failed, retrying...`);
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
