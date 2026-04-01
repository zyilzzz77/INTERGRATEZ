import { NextResponse } from 'next/server';

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';

    try {
        const FLICKREELS_BASE = process.env.FLICKREELS_API_BASE_URL || "https://flickreels.dramabos.my.id";
        const url = `${FLICKREELS_BASE}/api/home?lang=6&page=${page}`;
        
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": `${FLICKREELS_BASE}/`
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Upstream responded with status: ${response.status}`);
        }

        const json = await response.json();
        
        if (json.status_code === 1 && json.data?.data) {
            const items = json.data.data.map((item: any) => ({
                id: item.playlet_id.toString(),
                title: item.title,
                cover: item.cover,
                abstract: item.introduce,
                episodeCount: item.upload_num,
                tags: item.tag_list?.map((t: any) => t.name) || [],
                category: "Drama",
            }));

            const pageInfo = json.data.page_info || {};
            const currentPage = pageInfo.page || parseInt(page);
            const hasMore = items.length > 0; // Usually we'd check page < total_pages but simplicity is fine

            return NextResponse.json({
                status: true,
                data: items,
                nextPage: currentPage + 1,
                hasMore: hasMore
            });
        }

        return NextResponse.json({ status: false, data: [] });
    } catch (error: any) {
        console.error("FlickReels Home API Error:", error);
        return NextResponse.json(
            { status: false, error: "Gagal memuat data", data: [] },
            { status: 500 }
        );
    }
}
