import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "./i18n.config";

function getLocale(request: NextRequest): string {
    const acceptLanguage = request.headers.get("accept-language");
    if (!acceptLanguage) return i18n.defaultLocale;

    // Very basic parsing to prefer 'id' if Indonesian, else fallback to 'en'
    if (acceptLanguage.toLowerCase().includes("id")) {
        return "id";
    }
    return "en";
}

export function proxy(request: NextRequest) {
    // 1. IP & Fingerprint Logic (from original middleware)
    const requestHeaders = new Headers(request.headers);

    // Forward fingerprint from cookie as header for API routes
    const fingerprint = request.cookies.get("x-fingerprint")?.value;
    if (fingerprint) {
        requestHeaders.set("x-fingerprint", fingerprint);
    }

    // Helper to extract clean IPv4
    const extractIPv4 = (ipStr: string | null | undefined): string | null => {
        if (!ipStr) return null;
        // Handle comma-separated list
        const ip = ipStr.split(",")[0].trim();
        // IPv4 mapped into IPv6 (e.g., ::ffff:192.168.1.1)
        const v4MappedMatch = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
        if (v4MappedMatch) return v4MappedMatch[1];
        // Standard IPv4
        const v4Match = ip.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (v4Match) return v4Match[1];
        // If it's pure localhost IPv6
        if (ip === "::1") return "127.0.0.1";
        return ip;
    };

    // Ensure x-real-ip is always set (important for localhost/dev where
    // x-forwarded-for is not set by a reverse proxy)
    let finalIp = extractIPv4(requestHeaders.get("x-forwarded-for"))
        || extractIPv4(requestHeaders.get("x-real-ip"))
        || extractIPv4(requestHeaders.get("cf-connecting-ip"))
        || extractIPv4(requestHeaders.get("x-client-ip"));

    if (!finalIp || finalIp === "unknown") {
        // Fallback to fetch if completely unknown (Vercel edge case sometimes)
        finalIp = "127.0.0.1";
    }

    requestHeaders.set("x-real-ip", finalIp);

    // Security headers applied to all responses
    const securityHeaders: Record<string, string> = {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
    };

    // 2. i18n Locale Routing Logic
    const { pathname } = request.nextUrl;

    // Skip locale routing for API and static files if they accidentally bypass matcher
    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.includes(".")) {
        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
        Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
    }

    const pathnameHasLocale = i18n.locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
    );

    if (!pathnameHasLocale) {
        const locale = getLocale(request);
        const newUrl = new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url);
        // Preserve search params
        newUrl.search = request.nextUrl.search;
        const response = NextResponse.redirect(newUrl);
        Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
}

export const config = {
    // Match all page routes and api routes, except internal next stuff
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};