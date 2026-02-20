import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q");

    if (!q) {
        return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    try {
        const apiKey = "fdv_ZlC8qRyJLrcGcjcedw1eZg";
        const apiUrl = `https://api.ferdev.my.id/search/tokopedia?query=${encodeURIComponent(q)}&apikey=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return NextResponse.json({ items: data.data });
        } else {
            return NextResponse.json({ items: [] });
        }

    } catch (error) {
        console.error("[Tokopedia Search API Error]", error);
        return NextResponse.json({ error: "Failed to fetch data from Tokopedia API" }, { status: 500 });
    }
}
