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

        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { success: false, error: "Kredit tidak mencukupi" },
                { status: 403, headers: CORS },
            );
        }

        const type = req.nextUrl.searchParams.get("type") || "photo";

        if (type === "video") {
            const videoRes = await fetch(`https://api.neoxr.eu/api/pinterest-v2?q=${encodeURIComponent(query)}&show=50&type=video&apikey=OXlJB9`);
            const videoData = await videoRes.json();

            if (!videoData.status || !videoData.data) {
                return NextResponse.json(
                    { success: false, error: "Pinterest video search failed" },
                    { status: 500, headers: CORS },
                );
            }

            const proxyUrl = (url: string) =>
                url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : "";

            const pins = videoData.data.map((item: any) => {
                const videoContent = item.content?.[0] || {};
                return {
                    id: item.source.split('/').pop() || String(Math.random()),
                    images_url: proxyUrl(videoContent.thumbnail),
                    images_url_original: videoContent.thumbnail,
                    grid_title: item.title && item.title !== '-' ? item.title : '',
                    description: item.description && item.description !== '-' ? item.description : '',
                    pin: item.source,
                    created_at: '',
                    type: 'video',
                    pinner: {
                        full_name: item.author?.full_name || '',
                        image_small_url: proxyUrl(item.author?.image_small_url || ''),
                        follower_count: item.author?.follower_count || 0,
                    },
                    board: null,
                    reaction_counts: {},
                    dominant_color: '#27272a',
                    video_url: videoContent.url,
                    duration: videoContent.duration,
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
                { headers: CORS }
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
