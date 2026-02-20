import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    const resolusi = req.nextUrl.searchParams.get("resolusi");

    if (!url) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    if (!resolusi) {
        return NextResponse.json({ error: "Missing resolusi" }, { status: 400 });
    }

    try {
        // Use NexRay API
        const apiUrl = `https://api.nexray.web.id/downloader/ytmp4?url=${encodeURIComponent(url)}&resolusi=${resolusi}`;
        
        const res = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            throw new Error(`Upstream API error ${res.status}`);
        }

        const data = await res.json();
        
        if (!data.status || !data.result || !data.result.url) {
            console.error("[Resolve YouTube] API Error:", data);
            return NextResponse.json(
                { error: "Video link not found or API error" },
                { status: 404 }
            );
        }

        const videoUrl = data.result.url;

        // Redirect to the actual download link so proxy-download can fetch it
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
