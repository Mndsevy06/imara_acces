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
    const { name, email, password, portail, shiftStart, shiftEnd, readerId, status } = body;

    let validReaderId = null;
    if (readerId) {
      const reader = await db.cardReader.findUnique({ where: { id: readerId } });
      if (reader) validReaderId = readerId;
    }


    const userData: any = { name, email };
    if (password) {
      userData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update User
    const user = await db.user.update({
      where: { id },
      data: userData,
    });

    // Upsert Agent record
    const agent = await db.agent.upsert({
      where: { userId: id },
      create: {
        userId: id,
        portail: portail || 'Entrée Principale',
        shiftStart: shiftStart || '08:00',
        shiftEnd: shiftEnd || '16:00',
        readerId: validReaderId,
        status: status || 'OFFLINE'
      },
      update: {
        portail: portail || undefined,
        shiftStart: shiftStart || undefined,
        shiftEnd: shiftEnd || undefined,
        readerId: validReaderId !== null ? validReaderId : undefined,
        status: status || undefined
      }
    });

    return NextResponse.json({ ...user, agent });
  } catch (error) {
    console.error('[AGENT_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find the agent to get its ID
    const agent = await db.agent.findUnique({ where: { userId: id } });
    if (agent) {
      // Nullify access logs linked to this agent
      await db.accessLog.updateMany({
        where: { agentId: agent.id },
        data: { agentId: null }
      });
      
      await db.agent.delete({ where: { userId: id } });
    }

    // Also nullify any access logs linked directly to the user (if any)
    await db.accessLog.updateMany({
      where: { userId: id },
      data: { userId: null }
    });

    // Delete user
    await db.user.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[AGENT_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
