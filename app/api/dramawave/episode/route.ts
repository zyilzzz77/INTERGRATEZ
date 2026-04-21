import { NextRequest, NextResponse } from "next/server";
import { deductCredit } from "@/lib/credits";
import axios from "axios";

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
        const chapter = req.nextUrl.searchParams.get("chapter");

        if (!id || !chapter) {
            return NextResponse.json({ error: "Missing drama id or chapter" }, { status: 400, headers: CORS });
        }

        // Deduct credit for watching an episode
        const canAfford = await deductCredit("streaming");
        if (!canAfford) {
            return NextResponse.json({ error: "Akses VIP Diperlukan" }, { status: 403, headers: CORS });
        }

        const DRAMAWAVE_BASE = process.env.DRAMAWAVE_API_BASE_URL || "https://dramawave.dramabos.my.id";
        const DRAMABOS_CODE = process.env.DRAMABOS_CODE || "0B758C07EB07771BACB70777A0F4147A";
        const url = `${DRAMAWAVE_BASE}/api/episode/${id}/${chapter}?lang=in&code=${DRAMABOS_CODE}`;

        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 15000,
        });

        // Map the subtitle list to convert SRT URLs to our VTT proxy
        const data = res.data;
        if (data && Array.isArray(data.subtitle_list)) {
            data.subtitle_list = data.subtitle_list.map((sub: any) => ({
                ...sub,
                vtt: sub.subtitle ? `/api/dramawave/subtitle?url=${encodeURIComponent(sub.subtitle)}` : "",
            }));
        }

        return NextResponse.json({ status: true, data }, { headers: CORS });
    } catch (err: any) {
        const message = err.message || "Unknown error";
        console.error("DramaWave episode error:", message);
        return NextResponse.json({ error: "Gagal memuat episode", detail: message }, { status: 500, headers: CORS });
    }
}
