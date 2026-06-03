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
