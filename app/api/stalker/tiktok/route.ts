import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
        return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    try {
        const apiUrl =
            "https://api.nexray.web.id/stalker/tiktok?username=" +
            encodeURIComponent(username.replace(/^@/, ""));

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "TikTok stalker API error " + res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        if (!data.status || !data.result) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const r = data.result;

        return NextResponse.json({
            id: r.id || "",
            username: r.username || "",
            name: r.name || "",
            avatar: obfuscate(r.avatar || ""),
            bio: r.bio || "",
            link: r.link || "",
            verified: r.verified === "Verified",
            private: r.private === "Yes",
            seller: r.seller === "Yes",
            region: r.region || "",
            createTime: r.create_time || 0,
            stats: {
                followers: r.stats?.followers || "0",
                following: r.stats?.following || "0",
                likes: r.stats?.likes || "0",
                videos: r.stats?.videos || "0",
                friends: r.stats?.friend || "0",
            },
        });
    } catch (err) {
        console.error("[TikTok Stalker]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
