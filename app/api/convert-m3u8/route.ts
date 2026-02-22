import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export const maxDuration = 60; // Set max duration longer for video conversion
export const dynamic = "force-dynamic";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url || !url.includes(".m3u8")) {
        return new NextResponse("Invalid M3U8 URL", { status: 400, headers: CORS });
    }

    const tempDir = os.tmpdir();
    const tempFileId = Math.random().toString(36).substring(7);
    const outputPath = path.join(tempDir, `pinterest-${tempFileId}.mp4`);

    try {
        // Fast conversion using ffmpeg directly
        // We use -c copy to avoid re-encoding if possible, which saves massive CPU/RAM
        // We use -bsf:a aac_adtstoasc to fix audio stream container mismatch
        const command = `ffmpeg -i "${url}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`;

        await execAsync(command);

        // Check if file exists and has size
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
            throw new Error("Conversion resulted in empty file");
        }

        // Create stream from the converted file
        const fileStream = fs.createReadStream(outputPath);

        // Return file as response
        const res = new NextResponse(fileStream as unknown as ReadableStream, {
            headers: {
                ...CORS,
                "Content-Type": "video/mp4",
                "Content-Length": stats.size.toString(),
                "Content-Disposition": `attachment; filename="pinterest-video-${tempFileId}.mp4"`,
                "Cache-Control": "public, max-age=86400",
            },
        });

        // Clean up file after response is done (or if error happens later)
        // setTimeout is a hacky way since Next.js NextResponse doesn't easily expose stream end
        setTimeout(() => {
            try {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            } catch (e) {
                console.error("Failed to delete temp video file:", e);
            }
        }, 60000); // 1 minute should be enough for download to finish/buffer

        return res;

    } catch (error) {
        console.error("FFMPEG Conversion Error:", error);

        // Cleanup on error
        if (fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch (e) { }
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        return new NextResponse(`Error converting video: ${message}`, { status: 500, headers: CORS });
    }
}
