import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username");

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `https://api.ferdev.my.id/stalker/github?username=${username}&apikey=fdv_ZlC8qRyJLrcGcjcedw1eZg`
        );
        const data = await res.json();

        if (!data.success || !data.data) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const r = data.data;

        return NextResponse.json({
            username: r.login,
            name: r.name || r.login,
            id: r.id,
            avatar: obfuscate(r.avatar_url),
            url: r.html_url,
            type: r.type,
            company: r.company || "-",
            blog: r.blog || "-",
            location: r.location || "-",
            email: r.email || "-",
            bio: r.bio || "-",
            publicRepos: r.public_repos,
            publicGists: r.public_gists,
            followers: r.followers,
            following: r.following,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 500 });
    }
}