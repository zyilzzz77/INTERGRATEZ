import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q");
    if (!q) {
        return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    try {
        const apiUrl =
            "https://api.nexray.web.id/search/tiktok?q=" +
            encodeURIComponent(q);

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "TikTok search API error " + res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        if (!data.status || !data.result) {
            return NextResponse.json({ items: [] });
        }

        // Map to frontend-friendly format
        const items = data.result.map(
            (r: {
                id: string;
                title: string;
                cover: string;
                duration: string;
                data: string;
                taken_at: string;
                region: string;
                stats: {
                    views: string;
                    likes: string;
                    comment: string;
                    share: string;
                };
                author: {
                    nickname: string;
                    fullname: string;
                    avatar: string;
                };
                music_info: {
                    title: string;
                    author: string;
                    url: string;
                };
            }) => ({
                id: r.id,
                title: r.title,
                cover: r.cover, // Usually displayed via proxy-image on frontend, but can obfuscate if needed
                duration: r.duration,
                videoUrl: obfuscate(r.data),
                takenAt: r.taken_at,
                region: r.region,
                views: r.stats?.views || "0",
                likes: r.stats?.likes || "0",
                comments: r.stats?.comment || "0",
                shares: r.stats?.share || "0",
                author: {
                    nickname: r.author?.nickname || "",
                    fullname: r.author?.fullname || "",
                    avatar: r.author?.avatar || "",
                },
                music: {
                    title: r.music_info?.title || "",
                    author: r.music_info?.author || "",
                    url: obfuscate(r.music_info?.url || ""),
                },
            })
        );

        return NextResponse.json({ items });
    } catch (err) {
        console.error("[TikTok Search]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
