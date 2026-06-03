import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const agents = await db.user.findMany({
      where: { role: 'AGENT' },
      include: {
        agent: {
          include: {
            reader: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(agents);
  } catch (error) {
    console.error('[AGENTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, portail, shiftStart, shiftEnd, readerId } = body;

    if (!name || !email || !password || !portail) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    let validReaderId = null;
    if (readerId) {
      const reader = await db.cardReader.findUnique({ where: { id: readerId } });
      if (reader) validReaderId = readerId;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'AGENT',
        agent: {
          create: {
            portail,
            shiftStart: shiftStart || '08:00',
            shiftEnd: shiftEnd || '16:00',
            readerId: validReaderId,
            status: 'OFFLINE'
          }
        }
      },
      include: {
        agent: true
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('[AGENTS_POST]', error);
    if (error.code === 'P2002') {
      return new NextResponse('Email déjà utilisé', { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
