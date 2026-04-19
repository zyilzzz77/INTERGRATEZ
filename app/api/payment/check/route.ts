import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlazpayConfig, isTransactionExpired } from "@/lib/flazpay";

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { status: false, msg: "ID transaksi diperlukan." },
                { status: 400 }
            );
        }

        const transaction = await prisma.transaction.findUnique({
            where: { paymentId: id },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        });

        if (!transaction) {
            return NextResponse.json(
                { status: false, msg: "Transaksi tidak ditemukan." },
                { status: 404 }
            );
        }

        if (transaction.status === "paid") {
            return NextResponse.json(
                { status: true, msg: "Pembayaran berhasil!" }
            );
        }

        if (transaction.status === "failed") {
            return NextResponse.json(
                { status: false, msg: "Pembayaran gagal atau kedaluwarsa." }
            );
        }

        const flazpayConfig = getFlazpayConfig();
        if (isTransactionExpired(transaction.createdAt, flazpayConfig.expireMinutes)) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "failed" },
            });

            return NextResponse.json({
                status: false,
                msg: "Waktu pembayaran habis. Silakan buat transaksi baru.",
            });
        }

        return NextResponse.json({ status: false, msg: "Menunggu pembayaran." });
    } catch (error) {
        console.error("Payment check error:", error);
        return NextResponse.json(
            { status: false, msg: "Gagal mengecek status pembayaran." },
            { status: 500 }
        );
    }
}
