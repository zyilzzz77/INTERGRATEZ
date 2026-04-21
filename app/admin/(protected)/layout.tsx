import { verifyAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const metadata = {
    title: "Admin Panel — Inversave",
    description: "Inversave admin panel",
    robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const adminSession = await verifyAdminSession();

    if (!adminSession || adminSession.role !== "admin") {
        redirect("/admin/login");
    }

    return <>{children}</>;
}
