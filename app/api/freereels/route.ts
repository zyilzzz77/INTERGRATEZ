import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";

    try {
        const res = await fetch(
            `https://api.sansekai.my.id/api/freereels/homepage?page=${encodeURIComponent(page)}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    Accept: "application/json",
                },
                next: { revalidate: 300 },
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch FreeReels data" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("FreeReels API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
