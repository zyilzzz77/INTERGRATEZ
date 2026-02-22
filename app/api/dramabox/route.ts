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
        const id = req.nextUrl.searchParams.get("id");
        const uri = req.nextUrl.searchParams.get("uri");
        const isRefresh = req.nextUrl.searchParams.get("isRefresh") === "true";

        if (!id || !uri) {
            return NextResponse.json({ error: "Missing id or uri" }, { status: 400, headers: CORS });
        }

        // Deduct credit only if it's NOT a background token refresh
        if (!isRefresh) {
            const canAfford = await deductCredit();
            if (!canAfford) {
                return NextResponse.json({ error: "Kredit tidak mencukupi. Silakan top up." }, { status: 403, headers: CORS });
            }
        }

        const apikey = process.env.TAKO_API_KEY || "OXlJB9";
        const url = `https://api.neoxr.eu/api/dramabox-get-v2?id=${id}&uri=${uri}&apikey=${apikey}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Upstream API failed with status ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500, headers: CORS });
    }
}
