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
        const { packageId } = body;

        const pkg = TOPUP_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
        }

        // Call Tako API to create payment
        const apiKey = process.env.TAKO_API_KEY || "OXlJB9";
        const username = process.env.TAKO_USERNAME || "inversave";
        const message = encodeURIComponent(`Top Up ${pkg.name} - ${pkg.credits} Credits`);

        const takoRes = await fetch(
            `https://api.neoxr.eu/api/tako-create?username=${username}&amount=${pkg.price}&message=${message}&apikey=${apiKey}`
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
                amount: pkg.price,
                credits: pkg.credits,
                days: pkg.days,
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
                amount: pkg.price,
                credits: pkg.credits,
                days: pkg.days,
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
