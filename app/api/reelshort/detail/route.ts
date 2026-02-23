import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
        return NextResponse.json(
            { error: "Missing bookId parameter" },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(
            `https://api.sansekai.my.id/api/reelshort/detail?bookId=${encodeURIComponent(bookId)}`,
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
                { error: "Failed to fetch ReelShort detail" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ReelShort detail API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
