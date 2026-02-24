import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    const quality = req.nextUrl.searchParams.get("resolusi") || req.nextUrl.searchParams.get("quality");

    if (!url) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    if (!quality) {
        return NextResponse.json({ error: "Missing quality/resolusi" }, { status: 400 });
    }

    try {
        const apiUrl = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(url)}&type=video&quality=${quality}p&apikey=OXlJB9`;

        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Neoxr API error ${res.status}`);
        }

        const data = await res.json();

        if (!data.status || !data.data?.url) {
            console.error("[Resolve YouTube] Neoxr response:", data);
            return NextResponse.json(
                { error: "Video link not found or API error" },
                { status: 404 }
            );
        }

        const videoUrl = data.data.url;

        // Redirect to the actual download link
        return NextResponse.redirect(videoUrl, 302);
    } catch (err: unknown) {
        console.error("[Resolve YouTube] Error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to resolve video", detail: message },
            { status: 500 }
        );
    }
}
