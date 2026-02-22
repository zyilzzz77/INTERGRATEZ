import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlParam = request.nextUrl.searchParams.get("url");
    if (!urlParam) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    try {
        // Decode base64 URL
        const targetUrl = atob(urlParam);

        // Forward Range header for video seeking
        const range = request.headers.get("range");
        const headers: HeadersInit = {};
        if (range) {
            headers["Range"] = range;
        }

        const response = await fetch(targetUrl, { headers });

        // Copy key headers from upstream response
        const responseHeaders = new Headers();
        if (response.headers.get("Content-Type")) {
            responseHeaders.set("Content-Type", response.headers.get("Content-Type")!);
        }
        if (response.headers.get("Content-Length")) {
            responseHeaders.set("Content-Length", response.headers.get("Content-Length")!);
        }
        if (response.headers.get("Content-Range")) {
            responseHeaders.set("Content-Range", response.headers.get("Content-Range")!);
        }
        if (response.headers.get("Accept-Ranges")) {
            responseHeaders.set("Accept-Ranges", response.headers.get("Accept-Ranges")!);
        }

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error("Stream proxy error:", error);
        return new NextResponse("Error fetching video", { status: 500 });
    }
}