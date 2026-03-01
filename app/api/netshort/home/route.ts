import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Properly encode a URL that may contain non-ASCII characters in its path.
 * The Netshort cover URLs contain Chinese chars like 比 that break fetch.
 */
function sanitizeCoverUrl(rawUrl: string): string {
    try {
        const u = new URL(rawUrl.trim());
        // u.href will have the path properly percent-encoded
        return u.href;
    } catch {
        return rawUrl.trim();
    }
}

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
        const page = req.nextUrl.searchParams.get("page") || "1";
        const url = `https://netshort.dramabos.my.id/api/home/${page}?lang=in`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (raw.code !== 200 || !raw.data?.contentInfos) {
                    return NextResponse.json({
                        status: false,
                        error: "Invalid API response",
                        data: [],
                    }, { headers: CORS });
                }

                const contentInfos = raw.data.contentInfos;
                const maxOffset = raw.data.maxOffset ?? 20;
                const currentPage = parseInt(page, 10);
                const hasMore = currentPage < maxOffset;

                const mappedItems = contentInfos.map((item: any) => ({
                    id: item.shortPlayId,
                    libraryId: item.shortPlayLibraryId,
                    title: (item.shortPlayName || "").trim(),
                    cover: item.shortPlayCover
                        ? sanitizeCoverUrl(item.shortPlayCover)
                        : "",
                    tags: item.labelArray || [],
                    heatScore: item.heatScoreShow || "",
                    isNew: item.isNewLabel ?? false,
                    scriptName: item.scriptName || "",
                }));

                return NextResponse.json({
                    status: true,
                    data: mappedItems,
                    hasMore,
                    nextPage: currentPage + 1,
                    contentName: raw.data.contentName || "Netshort Drama",
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Netshort Home] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server Netshort sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message, details: lastError?.response?.data || {} }, { status: 500, headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
