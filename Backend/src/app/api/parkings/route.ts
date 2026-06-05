import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const parkings = await db.parkingZone.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(parkings);
  } catch (error) {
    console.error('[PARKINGS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, capacity } = body;

    if (!name || !type || typeof capacity !== 'number') {
      return new NextResponse('Données invalides', { status: 400 });
    }

    const parking = await db.parkingZone.create({
      data: {
        name,
        type,
        capacity,
        currentCount: 0,
      },
    });

    return NextResponse.json(parking);
  } catch (error) {
    console.error('[PARKINGS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
