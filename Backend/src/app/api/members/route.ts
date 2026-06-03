import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function normalizeCardId(raw: string): string {
  return raw.replace(/[\s:.-]/g, '').toUpperCase();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const members = await db.user.findMany({
      where: {
        role: 'MEMBER',
        OR: query ? [
          { name: { contains: query, mode: 'insensitive' } },
          { licensePlate: { contains: query, mode: 'insensitive' } },
        ] : undefined,
      },
      include: {
        assignedParking: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('[MEMBERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, licensePlate, cardId: rawCardId, profile, assignedParkingId } = body;
    const cardId = rawCardId ? normalizeCardId(rawCardId) : null;

    if (!name || !licensePlate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const member = await db.user.create({
      data: {
        name,
        licensePlate,
        cardId,
        profile,
        role: 'MEMBER',
        assignedParkingId: assignedParkingId || null,
      },
      include: {
        assignedParking: true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('[MEMBERS_POST]', error);
    if ((error as any).code === 'P2002') {
      return new NextResponse('Plaque ou Carte déjà utilisée', { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
