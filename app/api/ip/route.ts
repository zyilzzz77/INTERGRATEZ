import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    let ip = "Unknown IP";

    try {
        // Try getting IP from headers, fallback to basic NextRequest ip
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");

        // x-forwarded-for can be a comma-separated list of IPs. The first one is the original client.
        if (forwardedFor) {
            ip = forwardedFor.split(",")[0].trim();
        } else if (realIp) {
            ip = realIp;
        }

        // Clean up IPv6 mapped IPv4 address (Localhost)
        if (ip === "::1" || ip === "127.0.0.1" || ip.includes("::ffff:127.0.0.1")) {
            // We are likely in local development or behind a proxy that isn't passing headers correctly.
            // Fetch the actual public IP using an external service as a fallback.
            const externalRes = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
            const externalData = await externalRes.json();
            if (externalData.ip) {
                ip = externalData.ip;
            }
        }
    } catch (error) {
        console.error("Error fetching IP:", error);
    }

    return NextResponse.json({ ip });
}
