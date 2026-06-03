import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const readers = await db.cardReader.findMany({
      orderBy: { label: 'asc' },
    });
    return NextResponse.json(readers);
  } catch (error) {
    console.error('[READERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, label, type, location, configurationId } = body;

    if (!id || !label || !type || !location) {
      return new NextResponse('Missing required fields (id, label, type, location)', { status: 400 });
    }

    const reader = await db.cardReader.create({
      data: {
        id,
        label,
        type,
        location,
        configurationId,
      },
    });

    return NextResponse.json(reader);
  } catch (error) {
    console.error('[READERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
