import { NextRequest, NextResponse } from "next/server";

const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
const SAWERIA_API_URL = `${NEOXR_BASE}/api/saweria-create`;
const SAWERIA_USER_ID = process.env.SAWERIA_USER_ID;
const SAWERIA_API_KEY = process.env.TAKO_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { amount, message } = await req.json();

        if (!amount || typeof amount !== "number" || amount < 1000) {
            return NextResponse.json(
                { status: false, message: "Nominal minimal Rp 1.000" },
                { status: 400 }
            );
        }

        const encodedMessage = encodeURIComponent(message || "Top Up Kredit");
        const url = `${SAWERIA_API_URL}?userid=${SAWERIA_USER_ID}&amount=${amount}&message=${encodedMessage}&apikey=${SAWERIA_API_KEY}`;

        const response = await fetch(url);

        // Check if API returned a non-OK status
        if (!response.ok) {
            console.error(`Saweria API returned status ${response.status}`);
            return NextResponse.json(
                { status: false, message: `Layanan pembayaran sedang gangguan (HTTP ${response.status}). Coba lagi nanti.` },
                { status: 502 }
            );
        }

        // Make sure the response is JSON, not HTML
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Saweria API returned non-JSON response:", text.substring(0, 200));
            return NextResponse.json(
                { status: false, message: "Layanan pembayaran sedang tidak tersedia. Coba lagi nanti." },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json(
                { status: false, message: "Gagal membuat pembayaran. Coba lagi." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: true,
            data: {
                id: data.data.id,
                amount: data.data.amount,
                expired_at: data.data.expired_at,
                url: data.data.url || data.data.receipt,
                qr_image: data.data.qr_image,
            },
        });
    } catch (error) {
        console.error("Payment creation error:", error);
        return NextResponse.json(
            { status: false, message: "Terjadi kesalahan server." },
            { status: 500 }
        );
    }
}
