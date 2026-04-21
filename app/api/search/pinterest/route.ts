import { NextRequest, NextResponse } from "next/server";
import { searchPinterest } from "@/lib/pinterest";
import { deductCredit } from "@/lib/credits";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    return handleSearch(req);
}

export async function POST(req: NextRequest) {
    return handleSearch(req);
}

async function handleSearch(req: NextRequest) {
    try {
        let query: string | null = null;

        if (req.method === "POST") {
            const body = await req.json().catch(() => ({}));
            query = body.query || body.q || body.keyword || null;
        }

        // Also check URL params (works for both GET and POST)
        if (!query) {
            query =
                req.nextUrl.searchParams.get("query") ||
                req.nextUrl.searchParams.get("q") ||
                req.nextUrl.searchParams.get("keyword");
        }

        if (!query) {
            return NextResponse.json(
                { success: false, error: "Query parameter required" },
                { status: 400, headers: CORS },
            );
        }

        const type = req.nextUrl.searchParams.get("type") || "photo";

        if (type === "video") {
            const apiKey = process.env.NEOXR_API_KEY;
            if (!apiKey) {
                return NextResponse.json(
                    {
                        success: false,
                        comingSoon: true,
                        message: "Pencarian video Pinterest sementara tidak tersedia (API key hilang)",
                    },
                    { status: 200, headers: CORS },
                );
            }

            const canAfford = await deductCredit();
            if (!canAfford) {
                return NextResponse.json(
                    { success: false, error: "Akses VIP Diperlukan" },
                    { status: 403, headers: CORS },
                );
            }

            let videoJson: any = null;
            try {
                const videoRes = await fetch(
                    `${process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu"}/api/pinterest-v2?q=${encodeURIComponent(query)}&show=50&type=video&apikey=${apiKey}`,
                );

                const raw = await videoRes.text();
                try {
                    videoJson = raw ? JSON.parse(raw) : null;
                } catch {
                    videoJson = null;
                }

                if (!videoRes.ok) {
                    const upstreamMsg =
                        videoJson?.message ||
                        videoJson?.error ||
                        (typeof raw === "string" && raw.length < 200 ? raw : "");
                    return NextResponse.json(
                        {
                            success: false,
                            comingSoon: true,
                            message: upstreamMsg || "Pinterest video search gagal (upstream)",
                        },
                        { status: 200, headers: CORS },
                    );
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
                return NextResponse.json(
                    {
                        success: false,
                        comingSoon: true,
                        message: `Pinterest video search error: ${msg}`,
                    },
                    { status: 200, headers: CORS },
                );
            }

            const items = Array.isArray(videoJson?.data)
                ? videoJson.data
                : Array.isArray(videoJson?.result)
                    ? videoJson.result
                    : [];

            if (!items.length) {
                return NextResponse.json(
                    { success: true, keyword: query, count: 0, pins: [], items: [] },
                    { headers: CORS },
                );
            }

            const proxyUrl = (url: string) =>
                url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : "";

            const pins = items.map((item: any) => {
                const videoContent = item.content?.[0] || item.media?.[0] || {};
                const thumbnail = videoContent.thumbnail || item.thumbnail || item.images?.[0] || "";
                const videoUrl =
                    videoContent.url ||
                    item.download?.[0]?.url ||
                    item.source ||
                    item.url ||
                    "";

                const sourceId = item.source?.split?.("/")?.pop?.() || item.id || crypto.randomUUID();

                return {
                    id: sourceId,
                    images_url: proxyUrl(thumbnail),
                    images_url_original: thumbnail,
                    grid_title: item.title && item.title !== "-" ? item.title : "",
                    description: item.description && item.description !== "-" ? item.description : "",
                    pin: item.source || item.url || "",
                    created_at: item.created_at || "",
                    type: "video",
                    pinner: {
                        full_name: item.author?.full_name || item.owner?.full_name || "",
                        image_small_url: proxyUrl(item.author?.image_small_url || item.owner?.avatar || ""),
                        follower_count: item.author?.follower_count || 0,
                    },
                    board: null,
                    reaction_counts: item.reaction_counts || {},
                    dominant_color: item.dominant_color || "#27272a",
                    video_url: videoUrl,
                    duration: videoContent.duration || item.duration,
                };
            });

            return NextResponse.json(
                {
                    success: true,
                    keyword: query,
                    count: pins.length,
                    pins,
                    items: pins.map((p: any) => ({
                        id: p.id,
                        image: p.images_url,
                        image_original: p.images_url_original,
                        title: p.grid_title,
                        description: p.description,
                        pin_url: p.pin,
                        created_at: p.created_at,
                        type: p.type,
                        pinner: p.pinner,
                        board: p.board,
                        reaction_counts: p.reaction_counts,
                        dominant_color: p.dominant_color,
                        video_url: p.video_url,
                        duration: p.duration,
                    })),
                },
                { headers: CORS },
            );
        }

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { success: false, error: "Akses VIP Diperlukan" },
                { status: 403, headers: CORS },
            );
        }

        const result = await searchPinterest(query);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Pinterest search failed" },
                { status: 500, headers: CORS },
            );
        }

        // Proxy images through our image proxy
        // const origin = req.nextUrl.origin;
        const proxyUrl = (url: string) =>
            url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : "";

        const pins = result.pins.map((pin) => ({
            pin: pin.pin,
            created_at: pin.created_at,
            id: pin.id,
            images_url: proxyUrl(pin.images_url),
            images_url_original: pin.images_url,
            grid_title: pin.grid_title,
            description: pin.description,
            type: pin.type,
            pinner: {
                ...pin.pinner,
                image_small_url: proxyUrl(pin.pinner?.image_small_url || ""),
            },
            board: pin.board,
            reaction_counts: pin.reaction_counts,
            dominant_color: pin.dominant_color,
        }));

        return NextResponse.json(
            {
                success: true,
                keyword: query,
                count: result.count,
                pins,
                // Also expose as items[] for the frontend search page
                items: pins.map((p) => ({
                    id: p.id,
                    image: p.images_url,
                    image_original: p.images_url_original,
                    title: p.grid_title,
                    description: p.description,
                    pin_url: p.pin,
                    created_at: p.created_at,
                    type: p.type,
                    pinner: p.pinner,
                    board: p.board,
                    reaction_counts: p.reaction_counts,
                    dominant_color: p.dominant_color,
                })),
            },
            { headers: CORS },
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Pinterest search error:", message);
        return NextResponse.json(
            { success: false, error: "Pinterest search failed: " + message },
            { status: 500, headers: CORS },
        );
    }
}
