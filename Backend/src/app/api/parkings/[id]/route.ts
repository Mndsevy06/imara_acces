import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, type, capacity } = body;

    if (!params.id) {
      return new NextResponse('ID missing', { status: 400 });
    }

    const updated = await db.parkingZone.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(typeof capacity === 'number' && { capacity }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PARKING_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return new NextResponse('ID missing', { status: 400 });
    }

    // Check if parking is used
    const accessLogsCount = await db.accessLog.count({
      where: { parkingId: params.id },
    });

    const usersCount = await db.user.count({
      where: { assignedParkingId: params.id },
    });

    if (accessLogsCount > 0 || usersCount > 0) {
      return new NextResponse('Impossible de supprimer ce parking car il est utilisé (logs ou utilisateurs liés).', { status: 400 });
    }

    await db.parkingZone.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PARKING_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
