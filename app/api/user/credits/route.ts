import { NextResponse } from "next/server";
import { getCreditInfo } from "@/lib/credits";

export async function GET() {
    try {
        const info = await getCreditInfo();
        return NextResponse.json(info);
    } catch (error) {
        console.error("Credits API Error:", error);
        return NextResponse.json({ credits: 0, isGuest: true }, { status: 500 });
    }
}
