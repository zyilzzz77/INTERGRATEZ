import { NextRequest, NextResponse } from "next/server";

// Helper to obfuscate URL
function obfuscate(str: string) {
    if (!str) return "";
    return Buffer.from(str).toString('base64');
}

export async function GET(req: NextRequest) {
    const uid = req.nextUrl.searchParams.get("uid");
    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const apiUrl =
            "https://api.nexray.web.id/stalker/freefire?uid=" +
            encodeURIComponent(uid.trim());

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Free Fire API error " + res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        if (!data.status || !data.result) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        const r = data.result;

        return NextResponse.json({
            uid: r.uid || "",
            name: r.name || "",
            level: r.level || 0,
            exp: r.exp || 0,
            region: r.region || "",
            likes: r.likes || 0,
            signature: r.signature || "",
            gender: r.gender || null,
            language: r.language?.replace("Language_", "") || "",
            createdAt: r.created_at || "",
            lastLogin: r.last_login || "",
            releaseVersion: r.release_version || "",
            creditScore: r.credit_score || 0,
            // Ranks
            brRankPoint: r.br_rank_point || 0,
            brMaxRank: r.br_max_rank || 0,
            csRankPoint: r.cs_rank_point || 0,
            csMaxRank: r.cs_max_rank || 0,
            // Guild
            guild: r.guild_name ? {
                name: r.guild_name || "",
                id: r.guild_id || "",
                level: r.guild_level || 0,
                members: r.guild_member || 0,
                capacity: r.guild_capacity || 0,
                leaderName: r.guild_leader_name || "",
                leaderUid: r.guild_leader_uid || "",
            } : null,
            // Pet
            pet: r.pet_id ? {
                id: r.pet_id,
                level: r.pet_level || 0,
            } : null,
            // Banner
            bannerImage: r.banner_image
                ? obfuscate(`https://api.nexray.web.id${r.banner_image}`)
                : "",
        });
    } catch (err) {
        console.error("[FreeFire Stalker]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
