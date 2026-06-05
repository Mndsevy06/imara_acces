import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, role, profile, licensePlate, cardId: rawCardId, assignedParkingId } = body;

    // Normalize to uppercase hex without separators so it matches ESP32 output
    const cardId = rawCardId ? rawCardId.replace(/[\s:.-]/g, '').toUpperCase() : null;

    const data: any = {
      name,
      email: email || null,
      role,
      profile: profile || null,
      licensePlate: licensePlate || null,
      cardId: cardId,
      assignedParkingId: assignedParkingId || null,
    };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data,
      include: {
        assignedParking: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('[USER_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the user is the super admin
    const firstAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    if (firstAdmin && firstAdmin.id === id) {
      return new NextResponse('Cannot delete the super admin account', { status: 403 });
    }

    const userToDelete = await db.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (userToDelete.presenceStatus === 'IN' && userToDelete.assignedParkingId) {
      await db.parkingZone.update({
        where: { id: userToDelete.assignedParkingId },
        data: {
          currentCount: { decrement: 1 },
        },
      });
    }

    await db.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[USER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
