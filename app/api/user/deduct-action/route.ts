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
        const canAfford = await deductCredit();
        if (!canAfford) {
            return NextResponse.json(
                { success: false, error: "Kredit tidak mencukupi" },
                { status: 403, headers: CORS }
            );
        }

        return NextResponse.json({ success: true }, { headers: CORS });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500, headers: CORS }
        );
    }
}
