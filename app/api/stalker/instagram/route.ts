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
        const clean = username.replace(/^@/, "");
        const apiUrl =
            "https://api.vreden.my.id/api/v1/stalker/instagram?username=" +
            encodeURIComponent(clean);

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Instagram stalker API error " + res.status },
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
            fullName: r.full_name || "",
            category: r.category || null,
            biography: r.biography || "",
            biographyEmail: r.biography_email || "-",
            bioLinks: r.bio_links || [],
            avatar: obfuscate(r.profile_pic_hd?.url || ""),
            isPrivate: !!r.is_private,
            isVerified: !!r.is_verified,
            isBusiness: !!r.is_business,
            stats: {
                followers: r.statistics?.follower?.toString() || "0",
                following: r.statistics?.following?.toString() || "0",
                posts: r.statistics?.post?.toString() || "0",
            },
        });
    } catch (err) {
        console.error("[Instagram Stalker]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
