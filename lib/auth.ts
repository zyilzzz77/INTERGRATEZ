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

// Demo login: VIP 24 hour trial
const DEMO_VIP_HOURS = 24;
const DEMO_VIP_CREDITS = 300;

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

                if (!user) {
                    // First time demo login: create user with VIP 24h trial
                    let accountId = generateAccountId();
                    let exists = await prisma.user.findUnique({ where: { accountId } });
                    while (exists) {
                        accountId = generateAccountId();
                        exists = await prisma.user.findUnique({ where: { accountId } });
                    }

                    const expiryDate = new Date(now);
                    expiryDate.setHours(expiryDate.getHours() + DEMO_VIP_HOURS);

                    user = await prisma.user.create({
                        data: {
                            name: demoLoginName,
                            email: demoLoginEmail,
                            image: demoLoginImage,
                            emailVerified: now,
                            accountId,
                            role: "vip",
                            credits: DEMO_VIP_CREDITS,
                            bonusCredits: 0,
                            creditsExpiry: expiryDate,
                        },
                    });

                    console.log(`[Demo] New demo user created with VIP 24h trial, expires: ${expiryDate.toISOString()}`);
                } else {
                    // Returning demo user
                    let accountId = user.accountId;
                    if (!accountId) {
                        accountId = generateAccountId();
                        let exists = await prisma.user.findUnique({ where: { accountId } });
                        while (exists) {
                            accountId = generateAccountId();
                            exists = await prisma.user.findUnique({ where: { accountId } });
                        }
                    }

                    const isExpired = !user.creditsExpiry || user.creditsExpiry <= now;

                    if (isExpired) {
                        // VIP trial expired → downgrade to free
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                accountId,
                                role: "free",
                                credits: 0,
                                creditsExpiry: user.creditsExpiry,
                            },
                        });
                        console.log(`[Demo] Demo user VIP expired, downgraded to free`);
                    } else {
                        // Still within VIP trial period, keep VIP
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                accountId,
                                name: demoLoginName,
                                image: demoLoginImage,
                            },
                        });
                        console.log(`[Demo] Demo user still has VIP trial until: ${user.creditsExpiry?.toISOString()}`);
                    }
                }

                return {
                    id: user.id,
                    name: user.name || demoLoginName,
                    email: user.email,
                    image: user.image,
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
    session: {
        strategy: "jwt",
    },
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
        async jwt({ token, user }) {
            // On initial sign-in, user object is available
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                const sessionUser = session.user as typeof session.user & {
                    id: string;
                    credits?: number;
                    creditsExpiry?: Date | null;
                    role?: string;
                };

                sessionUser.id = token.id as string;

                // Fetch fresh data from DB
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
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
