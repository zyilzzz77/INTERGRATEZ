import { NextResponse } from 'next/server';

// Force edge runtime for better performance
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const FLICKREELS_BASE = process.env.FLICKREELS_API_BASE_URL || "https://flickreels.dramabos.my.id";
    const DRAMABOS_CODE = process.env.DRAMABOS_CODE || "0B758C07EB07771BACB70777A0F4147A";
    const apiUrl = `${FLICKREELS_BASE}/batchload/${id}?lang=6&code=${DRAMABOS_CODE}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status_code !== 1) {
      return NextResponse.json(
        { error: data.msg || 'Failed to fetch drama details' },
        { status: 400 }
      );
    }

    // Return the specific data part
    return NextResponse.json(data.data);

  } catch (error: any) {
    console.error('FlickReels Detail Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drama details' },
      { status: 500 }
    );
  }
}
