import { ReactNode } from "react";
import "@/app/globals.css";

export const metadata = {
    title: "Admin Panel — Inversave",
    description: "Inversave admin panel",
    robots: "noindex, nofollow",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
