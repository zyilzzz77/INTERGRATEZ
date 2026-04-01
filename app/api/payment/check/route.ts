import { NextRequest, NextResponse } from "next/server";

const NEOXR_BASE = process.env.NEOXR_API_BASE_URL || "https://api.neoxr.eu";
const SAWERIA_CHECK_URL = `${NEOXR_BASE}/api/saweria-check`;
const SAWERIA_USER_ID = process.env.SAWERIA_USER_ID;
const SAWERIA_API_KEY = process.env.TAKO_API_KEY;

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { status: false, msg: "ID transaksi diperlukan." },
                { status: 400 }
            );
        }

        const url = `${SAWERIA_CHECK_URL}?userid=${SAWERIA_USER_ID}&id=${encodeURIComponent(id)}&apikey=${SAWERIA_API_KEY}`;
        const response = await fetch(url);

        // Safety: check response is OK and JSON
        if (!response.ok) {
            console.error(`Saweria check API returned status ${response.status}`);
            return NextResponse.json(
                { status: false, msg: "Gagal mengecek status pembayaran." },
                { status: 502 }
            );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Saweria check API returned non-JSON:", text.substring(0, 200));
            return NextResponse.json(
                { status: false, msg: "Layanan pengecekan tidak tersedia." },
                { status: 502 }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            status: data.status,
            msg: data.msg || (data.status ? "Pembayaran berhasil!" : "Belum dibayar."),
        });
    } catch (error) {
        console.error("Payment check error:", error);
        return NextResponse.json(
            { status: false, msg: "Gagal mengecek status pembayaran." },
            { status: 500 }
        );
    }
}
