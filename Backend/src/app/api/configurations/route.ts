import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type AgentAssignmentPayload = {
  agentId: string;
  readerId: string;
  shiftStart: string;
  shiftEnd: string;
  status?: 'ACTIVE' | 'OFFLINE';
};

function normalizeReaderIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function normalizeAssignments(input: unknown): AgentAssignmentPayload[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item): AgentAssignmentPayload => {
      const status: AgentAssignmentPayload['status'] = item.status === 'ACTIVE' ? 'ACTIVE' : 'OFFLINE';
      return {
        agentId: typeof item.agentId === 'string' ? item.agentId.trim() : '',
        readerId: typeof item.readerId === 'string' ? item.readerId.trim() : '',
        shiftStart: typeof item.shiftStart === 'string' && item.shiftStart.trim() ? item.shiftStart.trim() : '08:00',
        shiftEnd: typeof item.shiftEnd === 'string' && item.shiftEnd.trim() ? item.shiftEnd.trim() : '16:00',
        status,
      };
    })
    .filter((item) => item.agentId && item.readerId);
}

// GET /api/configurations - Liste toutes les configurations
export async function GET() {
  try {
    const configs = await db.configuration.findMany({
      include: {
        _count: {
          select: {
            agents: true,
            parkingZones: true,
            readers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformer pour correspondre au type attendu par le frontend
    const formattedConfigs = configs.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      status: config.status,
      createdAt: config.createdAt.toISOString(),
      agentCount: config._count.agents,
      parkingCount: config._count.parkingZones,
      readerCount: config._count.readers,
      creatorId: config.creatorId,
    }));

    return NextResponse.json(formattedConfigs);
  } catch (error) {
    console.error('[CONFIGS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/configurations - Crée une nouvelle configuration
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, status, creatorId } = body;
    const readerIds = normalizeReaderIds(body.readerIds);
    const assignments = normalizeAssignments(body.agentAssignments);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (readerIds.length === 0) {
      return new NextResponse('At least one reader is required', { status: 400 });
    }

    const config = await db.$transaction(async (tx) => {
      const createdConfig = await tx.configuration.create({
        data: {
          name: name.trim(),
          description: typeof description === 'string' ? description : '',
          status: status === 'LOCKED' ? 'LOCKED' : 'EDITABLE',
          creatorId: typeof creatorId === 'string' ? creatorId : null,
        },
      });

      if (createdConfig.status === 'LOCKED') {
        await tx.configuration.updateMany({
          where: { id: { not: createdConfig.id }, status: 'LOCKED' },
          data: { status: 'EDITABLE' },
        });
      }

      await tx.cardReader.updateMany({
        where: { id: { in: readerIds } },
        data: { configurationId: createdConfig.id },
      });

      for (const assignment of assignments) {
        if (!readerIds.includes(assignment.readerId)) {
          throw new Error(`Reader ${assignment.readerId} is not part of this configuration`);
        }

        const updated = await tx.agent.updateMany({
          where: { 
            OR: [
              { id: assignment.agentId },
              { userId: assignment.agentId }
            ]
          },
          data: {
            configurationId: createdConfig.id,
            readerId: assignment.readerId,
            shiftStart: assignment.shiftStart,
            shiftEnd: assignment.shiftEnd,
            status: assignment.status || 'OFFLINE',
          },
        });

        if (updated.count === 0) {
          throw new Error(`Agent ${assignment.agentId} not found`);
        }
      }

      return tx.configuration.findUnique({
        where: { id: createdConfig.id },
        include: {
          readers: true,
          agents: {
            include: {
              user: true,
              reader: true,
            },
          },
          _count: {
            select: {
              agents: true,
              readers: true,
              parkingZones: true,
            },
          },
        },
      });
    }, {
      maxWait: 15000, // 15 seconds max wait to connect to prisma 
      timeout: 30000, // 30 seconds
    });

    if (!config) {
      return new NextResponse('Internal Error', { status: 500 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[CONFIGS_POST]', error);
    const message = error instanceof Error ? error.message : 'Internal Error';
    return new NextResponse(message, { status: 500 });
  }
}
