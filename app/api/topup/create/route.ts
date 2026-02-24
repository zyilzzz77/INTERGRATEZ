import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOPUP_PACKAGES } from "@/lib/credits";

const SAWERIA_API_URL = "https://api.neoxr.eu/api/saweria-create";
const SAWERIA_USER_ID = "a4a04e34-3392-4c93-adcc-06eb79264c03";
const SAWERIA_API_KEY = "OXlJB9";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Silakan login terlebih dahulu untuk top up" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { packageId, customAmount } = body;

        let amount: number;
        let creditsToGive: number;
        let activeDays: number;
        let packageName: string;

        if (customAmount) {
            const amountNum = parseInt(customAmount, 10);
            if (isNaN(amountNum) || amountNum < 1000) {
                return NextResponse.json({ error: "Minimal top up custom adalah Rp 1.000" }, { status: 400 });
            }
            if (amountNum % 1000 !== 0) {
                return NextResponse.json({ error: "Nominal top up harus kelipatan Rp 1.000" }, { status: 400 });
            }
            amount = amountNum;
            creditsToGive = Math.floor(amountNum / 1000) * 50;
            activeDays = 30;
            packageName = `Custom Nominal (Rp ${amount})`;
        } else if (packageId) {
            const pkg = TOPUP_PACKAGES.find(p => p.id === packageId);
            if (!pkg) {
                return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
            }
            amount = pkg.price;
            creditsToGive = pkg.credits;
            activeDays = pkg.days;
            packageName = pkg.name;
        } else {
            return NextResponse.json({ error: "Silakan pilih paket atau masukkan nominal custom" }, { status: 400 });
        }
        // Add 7.5% admin fee to the amount
        const ADMIN_FEE_PERCENT = 7.5;
        const adminFee = Math.ceil(amount * ADMIN_FEE_PERCENT / 100);
        const totalAmount = amount + adminFee;

        // Call Saweria API to create payment (with fee included)
        const message = encodeURIComponent(`Top Up ${packageName} - ${creditsToGive} Credits`);
        const saweriaUrl = `${SAWERIA_API_URL}?userid=${SAWERIA_USER_ID}&amount=${totalAmount}&message=${message}&apikey=${SAWERIA_API_KEY}`;

        const response = await fetch(saweriaUrl);

        if (!response.ok) {
            console.error(`Saweria API returned status ${response.status}`);
            return NextResponse.json(
                { error: `Layanan pembayaran sedang gangguan (HTTP ${response.status}). Coba lagi nanti.` },
                { status: 502 }
            );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Saweria API returned non-JSON:", text.substring(0, 200));
            return NextResponse.json(
                { error: "Layanan pembayaran sedang tidak tersedia. Coba lagi nanti." },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.status || !data.data) {
            return NextResponse.json(
                { error: "Gagal membuat pembayaran. Coba lagi." },
                { status: 500 }
            );
        }

        // Save transaction to DB
        const transaction = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                paymentId: data.data.id,
                amount: totalAmount,
                credits: creditsToGive,
                days: activeDays,
                status: "pending",
                payUrl: data.data.url || data.data.receipt,
                qrImage: data.data.qr_image,
            },
        });

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                paymentId: data.data.id,
                amount: totalAmount,
                credits: creditsToGive,
                days: activeDays,
                qrImage: data.data.qr_image,
                payUrl: data.data.url || data.data.receipt,
                expiredAt: data.data.expired_at,
            },
        });
    } catch (error) {
        console.error("Create TopUp Error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}
