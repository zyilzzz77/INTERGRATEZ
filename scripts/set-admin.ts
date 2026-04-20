/**
 * Script: Set user as admin in database
 * Usage: npx tsx scripts/set-admin.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: npx tsx scripts/set-admin.ts <email>");
        process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`❌ User not found: ${email}`);
        console.log("Available users:");
        const all = await prisma.user.findMany({ select: { email: true, role: true } });
        all.forEach(u => console.log(`  - ${u.email} (${u.role})`));
        process.exit(1);
    }

    const updated = await prisma.user.update({
        where: { email },
        data: { role: "admin" },
    });

    console.log(`✅ User ${updated.email} is now ADMIN (id: ${updated.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
