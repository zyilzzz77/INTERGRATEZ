import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://70.153.144.239:2420";

export async function GET() {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(API_BASE, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    const latencyMs = Date.now() - started;
    clearTimeout(timeout);

    return NextResponse.json({
      online: res.ok,
      status: res.status,
      latencyMs,
    });
  } catch (error) {
    clearTimeout(timeout);
    return NextResponse.json(
      {
        online: false,
        error: error instanceof Error ? error.message : "unknown-error",
      },
      { status: 503 },
    );
  }
}
