import { NextRequest, NextResponse } from "next/server";
import { deductCredit } from "@/lib/credits";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: CORS });
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || !query.trim()) {
            return NextResponse.json(
                { error: "Parameter 'q' wajib diisi" },
                { status: 400, headers: CORS }
            );
        }

        // Deduct credit
        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { error: "Kredit tidak mencukupi" },
                { status: 403, headers: CORS }
            );
        }

        // Call neoxr AI Anime API
        const apiKey = process.env.NEOXR_API_KEY;
        const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(query.trim())}&apikey=${apiKey}`;

        console.log("[teks2animate] Calling API with query:", query);
        const apiRes = await fetch(apiUrl, { cache: "no-store" });

        const apiText = await apiRes.text();
        console.log("[teks2animate] API response:", apiRes.status, apiText.slice(0, 300));

        if (!apiRes.ok) {
            throw new Error(`API error: ${apiRes.status} - ${apiText.slice(0, 200)}`);
        }

        let apiData;
        try {
            apiData = JSON.parse(apiText);
        } catch {
            throw new Error(`API returned non-JSON: ${apiText.slice(0, 200)}`);
        }

        if (!apiData.status || !apiData.data?.url) {
            return NextResponse.json(
                { error: apiData.message || "Gagal generate gambar anime" },
                { status: 500, headers: CORS }
            );
        }

        console.log("[teks2animate] Success:", apiData.data.url);

        return NextResponse.json(
            {
                status: true,
                prompt: apiData.data.prompt,
                url: apiData.data.url,
            },
            { headers: CORS }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[teks2animate] ERROR:", message);
        return NextResponse.json(
            { error: "Gagal generate gambar anime", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
