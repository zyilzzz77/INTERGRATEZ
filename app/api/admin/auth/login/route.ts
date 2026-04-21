import { NextRequest, NextResponse } from "next/server";
import { encryptAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        const adminEmailObj = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const adminPassObj = (process.env.ADMIN_PASSWORD || "").trim();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (email.toLowerCase() !== adminEmailObj || password !== adminPassObj) {
            return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
        }

        // Must exist in DB as admin
        const dbAdmin = await prisma.user.findUnique({ where: { email: adminEmailObj } });
        if (!dbAdmin || dbAdmin.role !== "admin") {
            return NextResponse.json({ error: "Akses ditolak. Akun bukan admin DB." }, { status: 403 });
        }

        // Generate custom JWT
        const token = await encryptAdminSession({ email: dbAdmin.email, role: "admin", id: dbAdmin.id });

        const response = NextResponse.json({ success: true });

        // Set HttpOnly Cookie
        response.cookies.set(ADMIN_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;
    } catch (e: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
