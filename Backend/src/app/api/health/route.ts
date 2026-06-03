import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/health
// Vérifie que le serveur tourne et que la connexion à PostgreSQL est active.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
