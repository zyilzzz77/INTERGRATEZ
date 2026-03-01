import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    try {
        const queryUrl = req.nextUrl.searchParams.get("url");

        if (!queryUrl) {
            return new NextResponse("Missing subtitle URL", { status: 400 });
        }

        // Fetch the raw SRT file
        const res = await axios.get(queryUrl, {
            responseType: "text",
            timeout: 15000,
        });

        const srtContent = res.data;

        // Convert SRT to WebVTT
        // 0. Normalize line endings (Fixes Windows/Mac \r\n issues)
        let vttContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 1. Precise SRT to VTT timestamp conversion
        // WebVTT requires exactly a period (.) instead of a comma (,) before milliseconds
        // and exactly 3 digits for milliseconds.
        // We also append ' line:80%' to the end of the timestamp line to raise the subtitle slightly for better eye contact.
        vttContent = vttContent.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g, (match: string, start1: string, start2: string, end1: string, end2: string) => {
            return `${start1}.${start2.padEnd(3, '0')} --> ${end1}.${end2.padEnd(3, '0')} line:-6`;
        });

        // 2. Ensure cues are properly separated by exactly two newlines (so they don't merge into one cue block)
        vttContent = vttContent.replace(/\n{3,}/g, '\n\n');
        vttContent = vttContent.trim();

        // 3. Prepend with WEBVTT signature
        vttContent = `WEBVTT\n\n${vttContent}`;

        // Return as WebVTT MIME type
        return new NextResponse(vttContent, {
            headers: {
                "Content-Type": "text/vtt; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400", // Cache subtitles aggressively
            },
        });
    } catch (err: any) {
        console.error("Subtitle proxy error:", err.message);
        return new NextResponse("Failed to load subtitle", { status: 500 });
    }
}
