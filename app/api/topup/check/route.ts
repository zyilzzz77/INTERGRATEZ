import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
        }

        // Find the transaction
        const transaction = await prisma.transaction.findUnique({
            where: { paymentId },
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
        }

        if (transaction.userId !== session.user.id) {
            return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
        }

        if (transaction.status === "paid") {
            return NextResponse.json({
                success: true,
                status: "paid",
                message: "Pembayaran sudah dikonfirmasi sebelumnya",
            });
        }

        // Check payment status via Tako API
        const apiKey = process.env.TAKO_API_KEY || "OXlJB9";
        const takoRes = await fetch(
            `https://api.neoxr.eu/api/tako-check?id=${paymentId}&apikey=${apiKey}`
        );
        const takoData = await takoRes.json();

        if (takoData.status === true) {
            // Payment confirmed! Add credits to user
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + transaction.days);

            await prisma.$transaction([
                prisma.transaction.update({
                    where: { paymentId },
                    data: { status: "paid" },
                }),
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        credits: { increment: transaction.credits },
                        creditsExpiry: expiryDate,
                        role: "premium",
                    },
                }),
            ]);

            return NextResponse.json({
                success: true,
                status: "paid",
                message: `Pembayaran berhasil! +${transaction.credits} credits ditambahkan.`,
                creditsAdded: transaction.credits,
            });
        }

        return NextResponse.json({
            success: true,
            status: "pending",
            message: "Pembayaran belum terdeteksi",
        });
    } catch (error) {
        console.error("Check TopUp Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
