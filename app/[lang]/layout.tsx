import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { i18n } from "../../i18n.config";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/Toast";
import DownloadManager from "@/components/DownloadManager";
import AuthProvider from "@/components/AuthProvider";
import SmoothScroll from "@/components/SmoothScroll";
import { FingerprintProvider } from "@/components/FingerprintProvider";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import Footer from "@/components/Footer";
import { getDictionary } from "@/lib/dictionary";
import { constructMetadata } from "@/lib/seo";

import JsonLd from "@/components/JsonLd";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = constructMetadata();

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className="dark">
      <head>
        {/* Viewport with safe area support for Capacitor/mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        {/* Preconnect to frequently used external domains for faster LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.neoxr.eu" />
        <link rel="dns-prefetch" href="https://api.nexray.web.id" />
        <link rel="dns-prefetch" href="https://tikwm.com" />
        <JsonLd />
      </head>
      <body
        className={`${fontSans.variable} antialiased`}
      >
        <BackgroundAnimation />
        <SmoothScroll>
          <ErrorBoundary>
            <ThemeProvider>
              <AuthProvider>
                <FingerprintProvider>
                  <Navbar dict={dict.navbar} lang={lang} />
                  <main className="min-h-[calc(100vh-4rem)]">{children}</main>

                  {/* Footer */}
                  <Footer dict={dict.footer} lang={lang} />

                  <ToastContainer />
                  <DownloadManager />
                </FingerprintProvider>
              </AuthProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </SmoothScroll>
      </body>
    </html>
  );
}
