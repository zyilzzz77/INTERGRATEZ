import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTopupSuccessEmail } from "@/lib/mail";
import { TOPUP_PACKAGES, VIP_PACKAGES } from "@/lib/credits";

const SAWERIA_CHECK_URL = "https://api.neoxr.eu/api/saweria-check";
const SAWERIA_USER_ID = process.env.SAWERIA_USER_ID;
const SAWERIA_API_KEY = process.env.TAKO_API_KEY;

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

        // Expire after 15 minutes
        const createdAtMs = new Date(transaction.createdAt).getTime();
        const expireMs = createdAtMs + 15 * 60 * 1000;
        const nowMs = Date.now();

        if (nowMs > expireMs && transaction.status !== "failed") {
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

        // Check payment status via Saweria API
        const url = `${SAWERIA_CHECK_URL}?userid=${SAWERIA_USER_ID}&id=${encodeURIComponent(paymentId)}&apikey=${SAWERIA_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Saweria check API returned status ${response.status}`);
            return NextResponse.json({
                success: true,
                status: "pending",
                message: "Gagal mengecek status. Menunggu...",
            });
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return NextResponse.json({
                success: true,
                status: "pending",
                message: "Menunggu pembayaran...",
            });
        }

        const data = await response.json();

        if (data.status === true) {
            // Payment confirmed! Add credits to user
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + transaction.days);

            // Determine role to set
            const matchingPkg = [...TOPUP_PACKAGES, ...VIP_PACKAGES].find(
                p => p.credits === transaction.credits && p.days === transaction.days
            );
            const roleToSet = matchingPkg?.role || "premium";

            await prisma.$transaction([
                prisma.transaction.update({
                    where: { paymentId },
                    data: { status: "paid" },
                }),
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        credits: { increment: transaction.credits },
                        bonusCredits: { increment: transaction.bonusCredits },
                        creditsExpiry: expiryDate,
                        role: roleToSet,
                    },
                }),
            ]);

            // Send notification email asynchronously
            if (session?.user?.email && session?.user?.name) {
                const pkgName = `${transaction.credits} Koin (${transaction.days} Hari)`;
                sendTopupSuccessEmail(session.user.email, session.user.name, pkgName, transaction.amount, transaction.credits).catch((err) => {
                    console.error("[Email] Failed to send topup email:", err);
                });
            }

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
