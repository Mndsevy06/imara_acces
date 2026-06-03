import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { socketService } from '@/lib/socket';

// Compare HH:mm strings: "08:00" <= "14:30" <= "17:00"
function isWithinShift(shiftStart: string, shiftEnd: string, current: string): boolean {
  return current >= shiftStart && current <= shiftEnd;
}

function currentHHmm(): string {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

/** Normalize a card UID to the same format the ESP32 sends: uppercase hex, no separators.
 *  Handles: "A1:B2:C3:D4", "a1 b2 c3 d4", "A1-B2-C3-D4", "a1b2c3d4" → "A1B2C3D4" */
function normalizeCardId(raw: string): string {
  return raw.replace(/[\s:.-]/g, '').toUpperCase();
}

async function findUserByCardId(cardId: string) {
  // Fast path for already-normalized values.
  const directMatch = await db.user.findUnique({
    where: { cardId },
    include: { assignedParking: true },
  });

  if (directMatch) {
    return directMatch;
  }

  // Compatibility path for legacy records stored with separators/lowercase.
  const usersWithCard = await db.user.findMany({
    where: { cardId: { not: null } },
    select: { id: true, cardId: true },
  });

  const matched = usersWithCard.find((candidate) => {
    if (!candidate.cardId) return false;
    return normalizeCardId(candidate.cardId) === cardId;
  });

  if (!matched) {
    return null;
  }

  return db.user.findUnique({
    where: { id: matched.id },
    include: { assignedParking: true },
  });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête JSON invalide ou vide' }, { status: 400 });
    }

    const { cardId: rawCardId, readerId, source = 'PHONE' } = body as {
      cardId: string;
      readerId?: string;
      source?: 'PHONE' | 'BOITIER';
    };

    console.log(`[Verify API] Reçu scan - Source: ${source}, ReaderId: ${readerId}, CardId: ${rawCardId}`);

    if (!rawCardId) {
      return NextResponse.json({ error: 'Le champ cardId est requis' }, { status: 400 });
    }

    const cardId = normalizeCardId(rawCardId);

    // Emit reader discovery event (used by tilemap/config UI)
    if (readerId) {
      socketService.emit('reader:discovered', { readerId });
    }

    // ── 1. Validate the reader is assigned to at least one LOCKED configuration ──
    const reader = readerId
      ? await db.cardReader.findUnique({
          where: { id: readerId },
          include: {
            configuration: {
              include: {
                agents: { include: { user: true } },
                parkingZones: true,
              },
            },
          },
        })
      : null;

    // Find a fallback parking (used for FAILED logs when no config parking is available)
    let fallbackParking = await db.parkingZone.findFirst();
    if (!fallbackParking) {
      console.log("[Verify API] Aucune zone de parking trouvée, création d'une zone par défaut.");
      fallbackParking = await db.parkingZone.create({
        data: {
          name: 'Zone par défaut',
          type: 'VISITOR',
          capacity: 100,
          currentCount: 0,
        },
      });
    }

    // ── 2. Find valid agents for this reader right now ──
    type ValidAgent = { id: string; userId: string };
    let validAgents: ValidAgent[] = [];
    let configParking: { id: string } | null = null;
    let readerNotConfigured = false;

    if (!reader || !reader.configuration || reader.configuration.status !== 'LOCKED') {
      readerNotConfigured = true;
    } else {
      const config = reader.configuration;
      configParking = config.parkingZones[0] ?? null;

      const now = currentHHmm();
      validAgents = config.agents.filter(
        (agent) =>
          agent.readerId === readerId &&
          agent.status === 'ACTIVE' &&
          isWithinShift(agent.shiftStart, agent.shiftEnd, now)
      );
    }

    const parkingId = (configParking ?? fallbackParking).id;

    // ── 3. Look up user by cardId ──
    const user = await findUserByCardId(cardId);

    // ── 4. Handle FAILED cases ──

    if (!user) {
      const log = await db.accessLog.create({
        data: {
          userNameSnapshot: 'Inconnu',
          plateSnapshot: 'Inconnu',
          eventType: 'ENTREE',
          status: 'FAILED',
          failReason: 'Carte non reconnue',
          parkingId,
          readerId: reader?.id ?? null,
          source,
        },
        include: { parking: true, user: true },
      });
      const payload = { ...log, cardId };
      socketService.emit('scan:new', payload);
      if (validAgents.length > 0) {
        socketService.toAgents(validAgents.map((a) => a.id), 'scan:new', payload);
      }
      // Unknown card: deny access
      return NextResponse.json(
        { status: 'FAILED', reason: 'Carte non reconnue', log },
        { status: 403 }
      );
    }

    const shouldEnforceReaderValidation = false; // Désactivé pour permettre le scan téléphonique sans erreur "Lecteur non configuré" ou "Agent inactif"

    if (shouldEnforceReaderValidation && (readerNotConfigured || validAgents.length === 0)) {
      const reason = readerNotConfigured
        ? 'Lecteur non configuré'
        : validAgents.length === 0 && reader?.configuration?.status === 'LOCKED'
        ? (() => {
            const now = currentHHmm();
            const anyActive = reader.configuration!.agents.some(
              (a) => a.readerId === readerId && a.status === 'ACTIVE'
            );
            const anyOnShift = reader.configuration!.agents.some(
              (a) =>
                a.readerId === readerId &&
                isWithinShift(a.shiftStart, a.shiftEnd, now)
            );
            if (!anyActive) return 'Agent inactif';
            if (!anyOnShift) return 'Hors horaire';
            return 'Agent inactif';
          })()
        : 'Lecteur non configuré';

      const log = await db.accessLog.create({
        data: {
          userId: user.id,
          userNameSnapshot: user.name,
          plateSnapshot: user.licensePlate ?? 'N/A',
          eventType: user.presenceStatus === 'IN' ? 'SORTIE' : 'ENTREE',
          status: 'FAILED',
          failReason: reason,
          parkingId,
          readerId: reader?.id ?? null,
          source,
        },
        include: { parking: true, user: true },
      });
      socketService.emit('scan:new', log);
      return NextResponse.json({ status: 'FAILED', reason, log }, { status: 403 });
    }

    // ── 5. SUCCESS: check anti-bounce, toggle presence and create log ──
    const nowMs = Date.now();
    
    // Rechercher le dernier log SUCCESS de CET utilisateur pour éviter les rebonds ("double-bips" d'erreur) en moins de 10 secondes
    const lastSuccessLog = await db.accessLog.findFirst({
      where: {
        userId: user.id,
        status: 'SUCCESS'
      },
      orderBy: { timestamp: 'desc' },
    });

    if (lastSuccessLog) {
      const msSinceLastLog = nowMs - new Date(lastSuccessLog.timestamp).getTime();
      if (msSinceLastLog < 10000) { // 10 secondes = 10000 millisecondes
        // On considère ce scan comme un doublon involontaire (rebond).
        // On ne change PAS la présence et on ne recrée PAS un log de succès/inversion,
        // on renvoie juste les données actuelles pour que le boîtier donne l'accès ou valide sans pénaliser la suite.
        
        if (source === 'PHONE' && reader?.id) {
          const globalStore = global as any;
          if (!globalStore.pendingCommands) {
            globalStore.pendingCommands = new Map<string, string>();
          }
          globalStore.pendingCommands.set(reader.id, 'OPEN');
          console.log(`[Polling] Ordre OPEN stocké (anti-rebond) pour le lecteur : ${reader.id}`);
        } else if (source === 'PHONE') {
          console.log(`[Polling] Attention: scan téléphone anti-rebond réussi mais reader.id est null/vide ! readerId fourni: ${readerId}`);
        }

        return NextResponse.json(
          {
            status: 'SUCCESS', // On le rassure pour que la barrière s'ouvre si besoin / LED verte
            eventType: lastSuccessLog.eventType, 
            user: {
              name: user.name,
              profile: user.profile,
              presenceStatus: user.presenceStatus,
            },
            message: 'Rebond ignoré, accès maintenu'
          },
          { status: 200 }
        );
      }
    }

    const isCurrentlyIn = user.presenceStatus === 'IN';
    const newEventType = isCurrentlyIn ? 'SORTIE' : 'ENTREE';
    const newPresenceStatus = isCurrentlyIn ? 'OUT' : 'IN';

    // Un adhérent temporaire est un MEMBER sans profil ni mot de passe (créé via /visitors)
    const isTemporaryVisitor =
      user.role === 'MEMBER' && user.profile === null && !user.passwordHash;

    const [updatedUser, log] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          presenceStatus: newPresenceStatus,
          // Libérer automatiquement la carte après la sortie d'un adhérent temporaire
          ...(newEventType === 'SORTIE' && isTemporaryVisitor ? { cardId: null } : {}),
        },
      }),
      db.accessLog.create({
        data: {
          userId: user.id,
          userNameSnapshot: user.name,
          plateSnapshot: user.licensePlate ?? 'N/A',
          eventType: newEventType,
          status: 'SUCCESS',
          parkingId: user.assignedParkingId ?? parkingId,
          readerId: reader?.id ?? null,
          agentId: shouldEnforceReaderValidation ? (validAgents[0]?.id ?? null) : null,
          source,
        },
        include: { parking: true, user: true },
      }),
    ]);

    // Broadcast to admin (all) + individually to each valid agent's room
    socketService.emit('scan:new', log);
    socketService.toAgents(validAgents.map((a) => a.id), 'scan:new', log);

    console.log(`[Verify API] Fin traitement SUCCESS. Source: ${source}, Reader: ${reader?.id}`);

    // Si le scan vient du téléphone, on dit à l'ESP32 associé d'ouvrir la barrière (via HTTP Polling)
    if (source === 'PHONE' && reader?.id) {
      const globalStore = global as any;
      if (!globalStore.pendingCommands) {
        globalStore.pendingCommands = new Map<string, string>();
      }
      globalStore.pendingCommands.set(reader.id, 'OPEN');
      console.log(`[Polling] Ordre OPEN stocké pour le lecteur : ${reader.id}`);
    } else if (source === 'PHONE') {
      console.log(`[Polling] Attention: scan téléphone réussi mais reader.id est null/vide ! readerId fourni: ${readerId}`);
    }

    return NextResponse.json(
      {
        status: 'SUCCESS',
        eventType: newEventType,
        user: {
          name: updatedUser.name,
          profile: updatedUser.profile,
          presenceStatus: updatedUser.presenceStatus,
        },
        log,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors du traitement du scan:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

