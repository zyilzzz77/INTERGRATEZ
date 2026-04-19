import { PrismaClient } from "@prisma/client";

const DEV_DATABASE_URL = "file:./dev.db";

if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "development") {
        process.env.DATABASE_URL = DEV_DATABASE_URL;
        console.warn(
            `[Prisma] DATABASE_URL not found. Using local fallback ${DEV_DATABASE_URL} for development.`
        );
    } else {
        throw new Error("Missing DATABASE_URL environment variable.");
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
