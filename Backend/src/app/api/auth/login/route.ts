import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Handle Admin/Agent Login by Email/Password
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { agent: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    if (user.role === 'MEMBER') {
       return NextResponse.json({ error: 'Les adhérents n\'ont pas accès à cette plateforme' }, { status: 403 });
    }

    const token = signToken({ id: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        agent: user.agent
          ? {
              id: user.agent.id,
              portail: user.agent.portail,
              status: user.agent.status,
              shiftStart: user.agent.shiftStart,
              shiftEnd: user.agent.shiftEnd,
              readerId: user.agent.readerId,
              configurationId: user.agent.configurationId,
            }
          : null,
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
