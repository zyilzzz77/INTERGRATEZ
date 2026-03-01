import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendLoginSuccessEmail } from "@/lib/mail";

function generateAccountId(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars, e.g. "A3F2B1C9"
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            checks: ["none"],
        }),
    ],
    trustHost: true,
    events: {
        async createUser({ user }) {
            // Generate a unique 8-char account ID for new users
            let accountId = generateAccountId();
            // Ensure uniqueness (extremely unlikely collision but just in case)
            let exists = await prisma.user.findUnique({ where: { accountId } });
            while (exists) {
                accountId = generateAccountId();
                exists = await prisma.user.findUnique({ where: { accountId } });
            }
            await prisma.user.update({
                where: { id: user.id! },
                data: { accountId },
            });
        },
        async signIn({ user }) {
            console.log("[Auth Event] signIn fired for:", user.email, user.name);
            if (user.email && user.name) {
                // Send email asynchronously (fire-and-forget)
                sendLoginSuccessEmail(user.email, user.name).catch((err) => {
                    console.error("[Auth Event] Failed to send login email:", err);
                });
            } else {
                console.log("[Auth Event] Skipped email: email or name missing", { email: user.email, name: user.name });
            }
        },
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Fetch credits from DB
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { credits: true, creditsExpiry: true, role: true },
                });
                if (dbUser) {
                    (session.user as any).credits = dbUser.credits;
                    (session.user as any).creditsExpiry = dbUser.creditsExpiry;
                    (session.user as any).role = dbUser.role;
                }
            }
            return session;
        },
    },
});
