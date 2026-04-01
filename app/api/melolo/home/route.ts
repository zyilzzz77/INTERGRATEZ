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
        const offset = req.nextUrl.searchParams.get("offset") || "0";
        const MELOLO_BASE = process.env.MELOLO_API_BASE_URL || "https://melolo.dramabos.my.id";
        const url = `${MELOLO_BASE}/api/home?lang=id&offset=${offset}`;

        const MAX_RETRIES = 2;
        let lastError: any = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 30000 + (attempt * 15000),
                });

                const raw = res.data;

                if (raw.code !== 0 || !raw.data?.cell?.cell_data) {
                    return NextResponse.json({
                        status: false,
                        error: "Invalid API response",
                        data: [],
                    }, { headers: CORS });
                }

                const cellData = raw.data.cell.cell_data;
                const hasMore = raw.data.has_more ?? false;
                const nextOffset = raw.data.next_offset ?? 0;

                const mappedItems = cellData
                    .filter((cell: any) => cell.books && cell.books.length > 0)
                    .map((cell: any) => {
                        const book = cell.books[0];
                        // Extract view count from cover_stat_infos
                        let viewCount = "";
                        if (book.cover_stat_infos) {
                            const viewStat = book.cover_stat_infos.find(
                                (s: any) => s.stat_type === 6
                            );
                            if (viewStat) viewCount = viewStat.stat_value;
                        }

                        // Extract tags from stat_infos
                        const tags = book.stat_infos || [];

                        return {
                            id: book.book_id,
                            title: book.book_name,
                            cover: book.thumb_url
                                ? `/api/proxy-image?url=${encodeURIComponent(book.thumb_url.trim())}`
                                : "",
                            abstract: book.abstract || "",
                            episodeCount: parseInt(book.serial_count || "0", 10),
                            viewCount,
                            tags,
                            status: book.show_creation_status || "",
                            author: book.author || "",
                            isHot: book.is_hot === "1",
                            isDubbed: book.is_dubbed === "1",
                            category: cell.english_name || cell.client_log_module_name || "",
                        };
                    });

                return NextResponse.json({
                    status: true,
                    data: mappedItems,
                    hasMore,
                    nextOffset,
                }, { headers: CORS });
            } catch (err: any) {
                lastError = err;
                const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND";

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(`[Melolo Home] Attempt ${attempt + 1} failed (${err.code || 'timeout'}), retrying...`);
                    continue;
                }
                break;
            }
        }

        const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");
        const message = isTimeout
            ? "Server Melolo sedang lambat, silakan coba lagi..."
            : (lastError?.message || "Unknown error");
        return NextResponse.json({ error: message, details: lastError?.response?.data || {} }, { status: 500, headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        return NextResponse.json({ error: message, details: err.response?.data || {} }, { status: 500, headers: CORS });
    }
}
