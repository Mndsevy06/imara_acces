import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, licensePlate } = body;
    const role = 'ADMIN';

    // Check if user already exists
    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
      }
    }

    if (licensePlate) {
      const existingUser = await db.user.findUnique({ where: { licensePlate } });
      if (existingUser) {
        return NextResponse.json({ error: 'Cette plaque est déjà enregistrée' }, { status: 400 });
      }
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const user = await db.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        licensePlate,
      },
    });

    const token = signToken({ id: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        licensePlate: user.licensePlate,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}
