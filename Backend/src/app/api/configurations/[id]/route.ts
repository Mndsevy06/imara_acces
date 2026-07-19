import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { socketService } from '@/lib/socket';

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const config = await db.configuration.findUnique({
      where: { id },
      include: {
        readers: {
          include: {
            agents: {
              include: {
                user: true,
              },
            },
          },
        },
        agents: {
          include: {
            user: true,
            reader: true,
          }
        },
        parkingZones: true,
        routingRules: {
          include: {
            fromParking: true,
            toParking: true,
          }
        },
        tilemap: true,
      },
    });

    if (!config) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[CONFIG_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, status } = body;

    const shouldSyncReaders = Array.isArray(body.readerIds);
    const shouldSyncAssignments = Array.isArray(body.agentAssignments);
    const readerIds = normalizeReaderIds(body.readerIds);
    const assignments = normalizeAssignments(body.agentAssignments);

    if (shouldSyncReaders && readerIds.length === 0) {
      return new NextResponse('At least one reader is required', { status: 400 });
    }

    const config = await db.$transaction(async (tx) => {
      await tx.configuration.update({
        where: { id },
        data: {
          name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
          description: typeof description === 'string' ? description : undefined,
          status: status === 'LOCKED' || status === 'EDITABLE' ? status : undefined,
        },
      });

      if (status === 'LOCKED') {
        await tx.configuration.updateMany({
          where: { id: { not: id }, status: 'LOCKED' },
          data: { status: 'EDITABLE' },
        });
      }

      let effectiveReaderIds = readerIds;

      if (shouldSyncReaders) {
        await tx.cardReader.updateMany({
          where: {
            configurationId: id,
            id: { notIn: readerIds },
          },
          data: { configurationId: null },
        });

        await tx.cardReader.updateMany({
          where: { id: { in: readerIds } },
          data: { configurationId: id },
        });
      } else {
        const configReaders = await tx.cardReader.findMany({
          where: { configurationId: id },
          select: { id: true },
        });
        effectiveReaderIds = configReaders.map((reader) => reader.id);
      }

      if (shouldSyncAssignments) {
        const assignedAgentIds = assignments.map((assignment) => assignment.agentId);

        await tx.agent.updateMany({
          where: {
            configurationId: id,
            id: { notIn: assignedAgentIds },
          },
          data: {
            configurationId: null,
            readerId: null,
          },
        });

        for (const assignment of assignments) {
          if (!effectiveReaderIds.includes(assignment.readerId)) {
            throw new Error(`Reader ${assignment.readerId} is not part of this configuration`);
          }

          const user = await tx.user.findFirst({
            where: { 
              OR: [
                { id: assignment.agentId },
                { agent: { id: assignment.agentId } }
              ]
            }
          });

          if (!user) {
            throw new Error(`User for agent assignment ${assignment.agentId} not found`);
          }

          await tx.agent.upsert({
            where: { userId: user.id },
            update: {
              configurationId: id,
              readerId: assignment.readerId,
              shiftStart: assignment.shiftStart,
              shiftEnd: assignment.shiftEnd,
              status: assignment.status || 'OFFLINE',
            },
            create: {
              userId: user.id,
              portail: 'Non défini',
              configurationId: id,
              readerId: assignment.readerId,
              shiftStart: assignment.shiftStart,
              shiftEnd: assignment.shiftEnd,
              status: assignment.status || 'OFFLINE',
            }
          });
        }
      }

      return tx.configuration.findUnique({
        where: { id },
        include: {
          readers: true,
          agents: {
            include: {
              user: true,
              reader: true,
            },
          },
          parkingZones: true,
          routingRules: {
            include: {
              fromParking: true,
              toParking: true,
            },
          },
          tilemap: true,
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
      maxWait: 15000,
      timeout: 30000,
    });

    if (!config) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Notifier chaque agent affecté en temps réel pour mettre à jour leurs horaires sans redémarrage
    if (shouldSyncAssignments && config.agents) {
      for (const agent of config.agents) {
        socketService.toAgents([agent.id], 'agent:updated', {
          id: agent.id,
          shiftStart: agent.shiftStart,
          shiftEnd: agent.shiftEnd,
          readerId: agent.readerId,
          status: agent.status,
          configurationId: agent.configurationId,
        });
      }
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[CONFIG_PATCH]', error);
    const message = error instanceof Error ? error.message : 'Internal Error';
    return new NextResponse(message, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.$transaction(async (tx) => {
      await tx.configuration.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CONFIG_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
