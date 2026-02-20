import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import SmoothScroll from "@/components/SmoothScroll";
import BackgroundAnimation from "@/components/BackgroundAnimation";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://inversave.vercel.app"),
  title: "Inversave — Download Video & Audio dari Semua Platform",
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
  openGraph: {
    type: "website",
    url: "/",
    title: "Inversave — Download Video & Audio dari Semua Platform",
    description:
      "Download video dan audio dari YouTube, TikTok, Instagram, Facebook, Twitter, Spotify, dan lainnya. Gratis, cepat, tanpa iklan.",
    siteName: "Inversave",
    images: [
      {
        url: "/snoopy-logo.webp",
        width: 1200,
        height: 630,
        alt: "Inversave",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inversave — Download Video & Audio dari Semua Platform",
    description:
      "Download video dan audio dari YouTube, TikTok, Instagram, Facebook, Twitter, Spotify, dan lainnya. Gratis, cepat, tanpa iklan.",
    images: ["/snoopy-logo.webp"],
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
        className={`${fontSans.variable} antialiased`}
      >
        <BackgroundAnimation />
        <SmoothScroll>
          <ErrorBoundary>
              <ThemeProvider>
                  <Navbar />
                  <main className="min-h-[calc(100vh-4rem)]">{children}</main>

                  {/* Footer */}
                  <footer className="border-t border-white/5 bg-black/40 backdrop-blur-sm">
                  <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-neutral-500">
                      © {new Date().getFullYear()} <span className="font-bold text-neutral-300">Inversave</span>. Made with zyilzz
                  </div>
                  </footer>

                  <ToastContainer />
              </ThemeProvider>
          </ErrorBoundary>
        </SmoothScroll>
      </body>
    </html>
  );
}
