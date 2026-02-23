import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOPUP_PACKAGES } from "@/lib/credits";

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

        let amountForTako: number;
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
            amountForTako = amountNum;
            creditsToGive = Math.floor(amountNum / 1000) * 300;
            activeDays = 30;
            packageName = `Custom Nominal (Rp ${amountForTako})`;
        } else if (packageId) {
            const pkg = TOPUP_PACKAGES.find(p => p.id === packageId);
            if (!pkg) {
                return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
            }
            amountForTako = pkg.price;
            creditsToGive = pkg.credits;
            activeDays = pkg.days;
            packageName = pkg.name;
        } else {
            return NextResponse.json({ error: "Silakan pilih paket atau masukkan nominal custom" }, { status: 400 });
        }

        // Call Tako API to create payment
        const apiKey = process.env.TAKO_API_KEY || "OXlJB9";
        const username = process.env.TAKO_USERNAME || "inversave";
        const message = encodeURIComponent(`Top Up ${packageName} - ${creditsToGive} Credits`);

        const takoRes = await fetch(
            `https://api.neoxr.eu/api/tako-create?username=${username}&amount=${amountForTako}&message=${message}&apikey=${apiKey}`
        );
        const takoData = await takoRes.json();

        if (!takoData.status || !takoData.data) {
            return NextResponse.json(
                { error: "Gagal membuat pembayaran" },
                { status: 500 }
            );
        }

        // Save transaction to DB
        const transaction = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                paymentId: takoData.data.id,
                amount: amountForTako,
                credits: creditsToGive,
                days: activeDays,
                status: "pending",
                payUrl: takoData.data.url,
                qrImage: takoData.data.qr_image,
            },
        });

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                paymentId: takoData.data.id,
                amount: amountForTako,
                credits: creditsToGive,
                days: activeDays,
                qrImage: takoData.data.qr_image,
                payUrl: takoData.data.url,
                expiredAt: takoData.data.expired_at,
            },
        });
    } catch (error) {
        console.error("Create TopUp Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
