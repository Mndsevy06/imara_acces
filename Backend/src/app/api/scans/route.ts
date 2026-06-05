import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const logs = await db.accessLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        user: true,
        parking: true,
      },
    });

    // Format logs for the frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: log.userNameSnapshot,
      plate: log.plateSnapshot,
      type: log.eventType,
      parking: log.parking?.name || 'Inconnu',
      status: log.status,
      reason: log.failReason || undefined,
      source: log.source,
      readerId: log.readerId,
      isTemporary: (log.user?.profile === null && log.user?.role === 'MEMBER') || log.userNameSnapshot === 'Conducteur Temporaire'
    }));

    return NextResponse.json(formattedLogs, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des logs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
