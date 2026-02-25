import { NextRequest, NextResponse } from "next/server";
import { sendTopupSuccessEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
    const targetEmail = req.nextUrl.searchParams.get("email") || process.env.SMTP_EMAIL || "";
    const name = req.nextUrl.searchParams.get("name") || "Test User";

    try {
        await sendTopupSuccessEmail(
            targetEmail,
            name,
            "200 Koin (30 Hari)",  // packageName
            50000,                  // nominal (Rp50.000)
            200                     // credits
        );

        return NextResponse.json({
            success: true,
            message: `Topup receipt email sent to ${targetEmail}`,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
        });
    }
}
