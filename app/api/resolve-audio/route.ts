import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    try {
        // Use neoxr API with type=audio
        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const apiUrl = `${NEOXR_BASE}/api/youtube?url=${encodeURIComponent(url)}&type=audio&quality=128kbps&apikey=${process.env.NEOXR_API_KEY}`;

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Neoxr API error ${res.status}`);
        }

        const data = await res.json();
        const dlink = data?.data?.url;

        if (!dlink) {
            return NextResponse.json(
                { error: "Audio link not found" },
                { status: 404 }
            );
        }

        // Redirect to the actual download link
        return NextResponse.redirect(dlink, 302);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to resolve audio", detail: message },
            { status: 500 }
        );
    }
}
