import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFlazpayConfig, isTransactionExpired } from "@/lib/flazpay";

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

        if (transaction.status === "failed") {
            return NextResponse.json({
                success: true,
                status: "failed",
                message: "Transaksi gagal atau sudah kedaluwarsa.",
            });
        }

        const flazpayConfig = getFlazpayConfig();
        if (isTransactionExpired(transaction.createdAt, flazpayConfig.expireMinutes)) {
            await prisma.transaction.update({
                where: { paymentId },
                data: { status: "failed" },
            });

            return NextResponse.json({
                success: true,
                status: "failed",
                message: "Waktu pembayaran habis, silakan buat transaksi baru",
            });
        }

        return NextResponse.json({
            success: true,
            status: "pending",
            message: "Menunggu konfirmasi callback pembayaran...",
        });
    } catch (error) {
        console.error("Check TopUp Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
