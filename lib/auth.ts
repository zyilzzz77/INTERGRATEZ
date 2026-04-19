import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendLoginSuccessEmail } from "@/lib/mail";

const isDevelopment = process.env.NODE_ENV === "development";
if (isDevelopment) {
    const localAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    process.env.NEXTAUTH_URL = localAuthUrl;
    process.env.AUTH_URL = localAuthUrl;
}

function generateAccountId(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars, e.g. "A3F2B1C9"
}

const authSecret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development"
        ? "dev-only-auth-secret-change-this-before-production"
        : undefined);

if (process.env.NODE_ENV === "production" && !authSecret) {
    throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET in production environment.");
}

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
const demoLoginEnabled = (process.env.DEMO_LOGIN_ENABLED || "false").toLowerCase() === "true";
const demoLoginEmail = (process.env.DEMO_LOGIN_EMAIL || "").trim().toLowerCase();
const demoLoginPassword = (process.env.DEMO_LOGIN_PASSWORD || "").trim();
const demoLoginName = (process.env.DEMO_LOGIN_NAME || "Demo Reviewer").trim();
const demoLoginImageRaw = (process.env.DEMO_LOGIN_IMAGE || process.env.APP_LOGO_URL || "").trim();
const demoLoginImage = demoLoginImageRaw || "https://api.dicebear.com/9.x/initials/svg?seed=Reviewer%20Demo&backgroundColor=b6e3f4";
const demoLoginRoleRaw = (process.env.DEMO_LOGIN_ROLE || "premium").trim().toLowerCase();
const allowedDemoRoles = new Set(["free", "premium", "vip", "vip-max", "admin"]);
const demoLoginRole = allowedDemoRoles.has(demoLoginRoleRaw) ? demoLoginRoleRaw : "premium";
const demoLoginCreditsRaw = Number(process.env.DEMO_LOGIN_CREDITS || "300");
const demoLoginCredits = Number.isFinite(demoLoginCreditsRaw) && demoLoginCreditsRaw > 0
    ? Math.floor(demoLoginCreditsRaw)
    : 300;
const demoLoginExpiryDaysRaw = Number(process.env.DEMO_LOGIN_EXPIRE_DAYS || "30");
const demoLoginExpiryDays = Number.isFinite(demoLoginExpiryDaysRaw) && demoLoginExpiryDaysRaw > 0
    ? Math.floor(demoLoginExpiryDaysRaw)
    : 30;
const isDemoProviderReady = demoLoginEnabled && !!demoLoginEmail && !!demoLoginPassword;

const providers: Provider[] = [];

if (googleClientId && googleClientSecret) {
    providers.push(
        Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            checks: ["none"],
        })
    );
}

if (isDemoProviderReady) {
    providers.push(
        Credentials({
            name: "Demo Reviewer",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const emailInput = typeof credentials?.email === "string"
                    ? credentials.email.trim().toLowerCase()
                    : "";
                const passwordInput = typeof credentials?.password === "string"
                    ? credentials.password
                    : "";

                if (!emailInput || !passwordInput) return null;
                if (emailInput !== demoLoginEmail || passwordInput !== demoLoginPassword) {
                    return null;
                }

                let user = await prisma.user.findUnique({ where: { email: demoLoginEmail } });
                const now = new Date();
                const defaultExpiryDate = new Date(now);
                defaultExpiryDate.setDate(defaultExpiryDate.getDate() + demoLoginExpiryDays);

                if (!user) {
                    let accountId = generateAccountId();
                    let exists = await prisma.user.findUnique({ where: { accountId } });
                    while (exists) {
                        accountId = generateAccountId();
                        exists = await prisma.user.findUnique({ where: { accountId } });
                    }

                    user = await prisma.user.create({
                        data: {
                            name: demoLoginName,
                            email: demoLoginEmail,
                            image: demoLoginImage,
                            emailVerified: now,
                            accountId,
                            role: demoLoginRole,
                            credits: demoLoginCredits,
                            bonusCredits: 0,
                            creditsExpiry: defaultExpiryDate,
                        },
                    });
                } else {
                    let accountId = user.accountId;
                    if (!accountId) {
                        accountId = generateAccountId();
                        let exists = await prisma.user.findUnique({ where: { accountId } });
                        while (exists) {
                            accountId = generateAccountId();
                            exists = await prisma.user.findUnique({ where: { accountId } });
                        }
                    }

                    const normalizedCredits = Math.max(0, Math.min(user.credits, demoLoginCredits));
                    const normalizedExpiry = user.creditsExpiry && user.creditsExpiry > now
                        ? user.creditsExpiry
                        : defaultExpiryDate;

                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            accountId,
                            name: demoLoginName,
                            image: demoLoginImage,
                            emailVerified: user.emailVerified ?? now,
                            role: demoLoginRole,
                            credits: normalizedCredits,
                            creditsExpiry: normalizedExpiry,
                        },
                    });
                }

                return {
                    id: user.id,
                    name: user.name || demoLoginName,
                    email: user.email,
                };
            },
        })
    );
}

if (process.env.NODE_ENV === "development" && demoLoginEnabled && !isDemoProviderReady) {
    console.warn(
        "[Auth] DEMO_LOGIN_ENABLED=true, tapi DEMO_LOGIN_EMAIL atau DEMO_LOGIN_PASSWORD belum diisi."
    );
}

if (process.env.NODE_ENV === "development" && providers.length === 0) {
    console.warn(
        "[Auth] Semua provider login nonaktif. Isi AUTH_GOOGLE_* atau aktifkan DEMO_LOGIN_* di .env.local, lalu restart dev server."
    );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: authSecret,
    adapter: PrismaAdapter(prisma),
    providers,
    pages: {
        signIn: "/login",
    },
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
        async signIn({ user, account }) {
            console.log("[Auth Event] signIn fired for:", user.email, user.name);

            if (account?.provider === "credentials") {
                return;
            }

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
                const sessionUser = session.user as typeof session.user & {
                    id: string;
                    credits?: number;
                    creditsExpiry?: Date | null;
                    role?: string;
                };

                sessionUser.id = user.id;
                // Fetch credits from DB
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { credits: true, creditsExpiry: true, role: true },
                });
                if (dbUser) {
                    sessionUser.credits = dbUser.credits;
                    sessionUser.creditsExpiry = dbUser.creditsExpiry;
                    sessionUser.role = dbUser.role;
                }
            }
            return session;
        },
    },
});
