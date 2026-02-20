import { NextRequest, NextResponse } from "next/server";

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
        const q = req.nextUrl.searchParams.get("q");
        if (!q) {
            return NextResponse.json(
                { error: "Missing query" },
                { status: 400, headers: CORS }
            );
        }

        const url = "https://api.nexray.web.id/search/youtube?q=" + encodeURIComponent(q);

        const res = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        if (!res.ok) {
            throw new Error(`NexRay API ${res.status}`);
        }

        const data = await res.json();
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const rawItems = Array.isArray(data.result) ? data.result : [];

        // Map to frontend expected format
        const items = rawItems.map((item: any) => ({
            id: item.id || "",
            title: item.title || "No Title",
            description: item.description || "",
            thumbnail: item.image_url || "", // NexRay uses image_url
            channel: item.channel || "Unknown Channel",
            publishedAt: item.upload_at || "", // Use upload_at as publishedAt
            views: item.views || "",
            duration: item.duration || "",
            url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
        }));

        return NextResponse.json({ items }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Gagal mencari video YouTube", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
