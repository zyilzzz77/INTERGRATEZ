import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Clone the request headers
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

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Only run middleware on API routes (where credits are checked)
export const config = {
    matcher: "/api/:path*",
};
