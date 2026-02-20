import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INTEGRATEZ — Download Video & Audio dari Semua Platform",
  description:
    "Download video dan audio dari YouTube, TikTok, Instagram, Facebook, Twitter, Spotify, dan lainnya. Gratis, cepat, tanpa iklan.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "tiktok downloader",
    "instagram downloader",
    "spotify downloader",
  ],
  icons: {
    icon: "/snoopy-logo.webp",
    apple: "/snoopy-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
            <ThemeProvider>
                <Navbar />
                <main className="min-h-[calc(100vh-4rem)]">{children}</main>

                {/* Footer */}
                <footer className="border-t border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-neutral-500">
                    © {new Date().getFullYear()} <span className="font-bold text-neutral-300">INTERGRATEZ</span>. Made with zyilzz
                </div>
                </footer>

                <ToastContainer />
            </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
