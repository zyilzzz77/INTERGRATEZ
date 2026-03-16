import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const provider = url.searchParams.get("provider");
        const dramaId = url.searchParams.get("dramaId");

        if (!provider || !dramaId) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const history = await prisma.watchHistory.findUnique({
            where: {
                userId_provider_dramaId: {
                    userId: session.user.id,
                    provider,
                    dramaId,
                }
            }
        });

        if (!history) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: history });
    } catch (error) {
        console.error("GET /api/history Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { provider, dramaId, episode } = body;

        if (!provider || !dramaId || episode === undefined) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const history = await prisma.watchHistory.upsert({
            where: {
                userId_provider_dramaId: {
                    userId: session.user.id,
                    provider,
                    dramaId,
                }
            },
            update: {
                episode: Number(episode),
            },
            create: {
                userId: session.user.id,
                provider,
                dramaId,
                episode: Number(episode),
            }
        });

        return NextResponse.json({ success: true, data: history });
    } catch (error) {
        console.error("POST /api/history Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
