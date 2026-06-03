import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function normalizeCardId(raw: string): string {
  return raw.replace(/[\s:.-]/g, '').toUpperCase();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, licensePlate, cardId: rawCardId, profile, assignedParkingId } = body;
    const cardId = rawCardId ? normalizeCardId(rawCardId) : null;

    const member = await db.user.update({
      where: { id, role: 'MEMBER' },
      data: {
        name,
        licensePlate,
        cardId,
        profile,
        assignedParkingId: assignedParkingId || null,
      },
      include: {
        assignedParking: true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('[MEMBER_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.user.delete({
      where: { id, role: 'MEMBER' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[MEMBER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
