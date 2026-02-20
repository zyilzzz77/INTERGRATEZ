import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    try {
        const apiKey = "fdv_ZlC8qRyJLrcGcjcedw1eZg";
        const mp3ApiUrl = `https://api.ferdev.my.id/downloader/ytmp3?link=${encodeURIComponent(
            url
        )}&apikey=${apiKey}`;

        const res = await fetch(mp3ApiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (!res.ok) {
            throw new Error(`Upstream API error ${res.status}`);
        }

        const data = await res.json();
        const dlink = data?.data?.dlink;

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
