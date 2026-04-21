import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "admin@inversave.space";
    const u = await prisma.user.upsert({
        where: { email },
        update: { role: "admin" },
        create: {
            email,
            name: "Super Admin zyilzz",
            role: "super admin",
            credits: 0,
            accountId: "ADM-" + Math.floor(Math.random() * 10000)
        }
    });
    console.log("Upserted user:", u.email, "Role:", u.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
