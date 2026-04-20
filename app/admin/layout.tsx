import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata = {
    title: "Admin Panel — Inversave",
    description: "Inversave admin panel",
    robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/admin/login");
    }

    // Check admin role from DB via session
    const sessionUser = session.user as typeof session.user & { role?: string };
    if (sessionUser.role !== "admin") {
        redirect("/");
    }

    return <>{children}</>;
}
