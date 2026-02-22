import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateAccountId(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars, e.g. "A3F2B1C9"
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            checks: ["state"],
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
    pages: {
        signIn: "/login",
    },
});
