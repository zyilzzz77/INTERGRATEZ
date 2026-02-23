import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { error: "Missing id parameter" },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(
            `https://api.sansekai.my.id/api/freereels/detailAndAllEpisode?id=${encodeURIComponent(id)}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json",
                },
                next: { revalidate: 60 }, // cache 1 minute
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch FreeReels detail" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("FreeReels detail API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
