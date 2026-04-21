import { NextRequest, NextResponse } from "next/server";
import { deductCredit } from "@/lib/credits";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function POST(req: NextRequest) {
    try {
        // 1. Read uploaded file
        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No image file provided" },
                { status: 400, headers: CORS }
            );
        }

        console.log("[remove-bg] File received:", file.name, file.type, file.size, "bytes");

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." },
                { status: 400, headers: CORS }
            );
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Ukuran file maksimal 10MB" },
                { status: 400, headers: CORS }
            );
        }

        // 2. Deduct credit
        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { error: "Akses VIP Diperlukan" },
                { status: 403, headers: CORS }
            );
        }

        // 3. Upload image to catbox.moe to get a public URL
        const catboxForm = new FormData();
        catboxForm.append("reqtype", "fileupload");

        // Convert File to Blob from ArrayBuffer for Node.js compatibility
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        catboxForm.append("fileToUpload", blob, file.name || "image.jpg");

        console.log("[remove-bg] Uploading to catbox.moe...");
        const CATBOX_BASE = process.env.CATBOX_API_BASE_URL || "https://catbox.moe";
        const uploadRes = await fetch(`${CATBOX_BASE}/user/api.php`, {
            method: "POST",
            body: catboxForm,
        });

        const imageUrl = (await uploadRes.text()).trim();
        console.log("[remove-bg] Catbox response:", uploadRes.status, imageUrl);

        if (!uploadRes.ok || !imageUrl.startsWith("http")) {
            throw new Error(`Image upload failed: ${uploadRes.status} - ${imageUrl}`);
        }

        console.log("[remove-bg] Image uploaded:", imageUrl);

        // 4. Call neoxr Remove BG API
        const apiKey = process.env.NEOXR_API_KEY;
        const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
        const apiUrl = `${NEOXR_BASE}/api/nobg?image=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

        console.log("[remove-bg] Calling remove-bg API...");
        const apiRes = await fetch(apiUrl, { cache: "no-store" });

        const apiText = await apiRes.text();
        console.log("[remove-bg] API response:", apiRes.status, apiText.slice(0, 300));

        if (!apiRes.ok) {
            throw new Error(`Remove BG API error: ${apiRes.status} - ${apiText.slice(0, 200)}`);
        }

        let apiData;
        try {
            apiData = JSON.parse(apiText);
        } catch {
            throw new Error(`Remove BG API returned non-JSON: ${apiText.slice(0, 200)}`);
        }

        if (!apiData.status || !apiData.data?.no_background) {
            return NextResponse.json(
                { error: apiData.message || "Gagal menghapus background" },
                { status: 500, headers: CORS }
            );
        }

        console.log("[remove-bg] Success:", apiData.data.no_background);

        return NextResponse.json(
            {
                status: true,
                original: imageUrl,
                result: apiData.data.no_background,
            },
            { headers: CORS }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[remove-bg] ERROR:", message);
        if (err instanceof Error && err.stack) {
            console.error("[remove-bg] Stack:", err.stack);
        }
        return NextResponse.json(
            { error: "Gagal menghapus background", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
