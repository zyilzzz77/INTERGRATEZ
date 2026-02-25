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
        const url = searchParams.get("url");

        if (!url || !url.trim()) {
            return NextResponse.json(
                { error: "Parameter 'url' wajib diisi" },
                { status: 400, headers: CORS }
            );
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: "URL tidak valid" },
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

        // Call neoxr Shorten API
        const apiKey = process.env.NEOXR_API_KEY;
        const apiUrl = `https://api.neoxr.eu/api/shorten?url=${encodeURIComponent(url.trim())}&apikey=${apiKey}`;

        console.log("[shortener] Calling API with url:", url);
        const apiRes = await fetch(apiUrl, { cache: "no-store" });

        const apiText = await apiRes.text();
        console.log("[shortener] API response:", apiRes.status, apiText.slice(0, 300));

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
                { error: apiData.message || "Gagal mempersingkat URL" },
                { status: 500, headers: CORS }
            );
        }

        console.log("[shortener] Success:", apiData.data.url);

        return NextResponse.json(
            {
                status: true,
                origin: apiData.data.origin,
                url: apiData.data.url,
                code: apiData.data.code,
                expired_at: apiData.data.expired_at,
            },
            { headers: CORS }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[shortener] ERROR:", message);
        return NextResponse.json(
            { error: "Gagal mempersingkat URL", detail: message },
            { status: 500, headers: CORS }
        );
    }
}
