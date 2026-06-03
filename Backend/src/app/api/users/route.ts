import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const profile = searchParams.get('profile');

    const users = await db.user.findMany({
      where: {
        role: role ? (role as any) : undefined,
        presenceStatus: status ? (status as any) : undefined,
        profile: profile ? (profile as any) : undefined,
        OR: query ? [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
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

    const firstAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    const usersWithSuperAdminFlag = users.map(user => ({
      ...user,
      isSuperAdmin: firstAdmin ? user.id === firstAdmin.id : false
    }));

    return NextResponse.json(usersWithSuperAdminFlag);
  } catch (error) {
    console.error('[USERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, profile, licensePlate, cardId: rawCardId, assignedParkingId } = body;

    if (!name || !role) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Normalize to uppercase hex without separators so it matches ESP32 output
    const cardId = rawCardId ? rawCardId.replace(/[\s:.-]/g, '').toUpperCase() : null;

    let passwordHash = undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await db.user.create({
      data: {
        name,
        email: email || null,
        passwordHash,
        role,
        profile: profile || null,
        licensePlate: licensePlate || null,
        cardId: cardId,
        assignedParkingId: assignedParkingId || null,
      },
      include: {
        assignedParking: true,
      },
    });

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('[USERS_POST]', error);
    if (error.code === 'P2002') {
      return new NextResponse('Email, Plaque ou Carte déjà utilisée', { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
