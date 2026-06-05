import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { socketService } from '@/lib/socket';

function normalizeCardId(raw: string): string {
  return raw.replace(/[\s:.-]/g, '').toUpperCase();
}

function cardIdCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  const normalized = normalizeCardId(trimmed);
  return Array.from(new Set([trimmed, normalized].filter(Boolean)));
}

export async function POST(req: Request) {
  try {
    const { name, licensePlate, cardId: rawCardId, parkingId } = await req.json();
    const cardId = rawCardId ? normalizeCardId(rawCardId) : '';
    const candidates = rawCardId ? cardIdCandidates(rawCardId) : [];

    if (!cardId) {
      return NextResponse.json({ error: 'Le champ cardId est requis' }, { status: 400 });
    }

    // Libérer la carte si elle appartient déjà à quelqu'un
    await db.user.updateMany({
      where: { OR: candidates.map((value) => ({ cardId: value })) },
      data: { cardId: null }
    });

    const targetPlate = licensePlate || `INCONNU-${Date.now()}`;

    // 2. Anti-rebond STRICT en mémoire
    const nowMs = Date.now();
    const globalStore = global as any;
    if (!globalStore.lastScanTime) globalStore.lastScanTime = new Map<string, number>();
    
    const lastScanMs = globalStore.lastScanTime.get(targetPlate) || 0;
    if (nowMs - lastScanMs < 5000) {
      return NextResponse.json({ message: 'Carte assignée (Rebond ignoré)' }, { status: 200 });
    }
    globalStore.lastScanTime.set(targetPlate, nowMs);

    // 3. Trouver le parking spécifié ou un parking par défaut
    let targetParking;
    if (parkingId) {
      targetParking = await db.parkingZone.findUnique({ where: { id: parkingId } });
    } else {
      targetParking = await db.parkingZone.findFirst();
    }

    if (!targetParking) {
      return NextResponse.json({ error: 'Aucun parking disponible' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { licensePlate: targetPlate } });
    const isAlreadyIn = existingUser?.presenceStatus === 'IN';

    // Contrôle de capacité (uniquement si le visiteur n'est pas déjà à l'intérieur)
    if (!isAlreadyIn && targetParking.currentCount >= targetParking.capacity) {
      return NextResponse.json(
        { error: `Le parking ${targetParking.name} est complet (${targetParking.currentCount}/${targetParking.capacity}).` }, 
        { status: 403 }
      );
    }

    // 4. Créer ou Mettre à jour l'utilisateur et le log d'accès (Transaction)
    const queries: any[] = [
      db.user.upsert({
        where: { licensePlate: targetPlate },
        update: {
          name: name || undefined,
          cardId: cardId,
          presenceStatus: 'IN',
          assignedParkingId: targetParking.id,
        },
        create: {
          name: name || 'Conducteur Temporaire',
          licensePlate: targetPlate, 
          role: 'MEMBER',
          profile: null, // Utilisateur sans profil = visiteur
          cardId: cardId,
          presenceStatus: 'IN', // 1. Marqué comme entré directement
          assignedParkingId: targetParking.id,
        }
      }),
      db.accessLog.create({
        data: {
          // Note: On met provisoirement l'userId à null si la plaque n'existait pas avant, 
          // car l'upsert est asynchrone, mais en SQL l'upsert renvoie l'ID immédiatement. 
          // En Prisma, on ne peut pas référencer l'ID de l'upsert dans la transaction sans code complexe,
          // Mais dans ce cas c'est un log donc on utilise userNameSnapshot et plateSnapshot.
          userNameSnapshot: name || 'Conducteur Temporaire',
          plateSnapshot: targetPlate,
          eventType: 'ENTREE',
          status: 'SUCCESS',
          parkingId: targetParking.id,
          source: 'PHONE',
        },
        include: { parking: true, user: true },
      }),
    ];
    if (!isAlreadyIn) {
      queries.push(
        db.parkingZone.update({
          where: { id: targetParking.id },
          data: { currentCount: { increment: 1 } },
        })
      );
    }

    const results = await db.$transaction(queries);
    const user = results[0];
    const log = results[1];
    
    // Associer l'userId au log après création (car on ne pouvait pas le faire dans l'array transaction directement pour un nouvel user)
    const finalLog = await db.accessLog.update({
      where: { id: log.id },
      data: { userId: user.id },
      include: { parking: true, user: true },
    });

    // 4. Émettre le log pour l'afficher en direct dans l'historique
    socketService.emit('scan:new', finalLog);

    // 5. Ordre d'ouverture de la barrière physique (ESP32 Polling)
    if (!globalStore.pendingCommands) {
      globalStore.pendingCommands = new Map<string, string>();
    }
    // On envoie l'ordre "OPEN" universel ('ALL') pour ouvrir la barrière
    globalStore.pendingCommands.set('ALL', 'OPEN');
    console.log(`[Polling] Ordre OPEN universel stocké (ALL) suite à assignation visiteur.`);

    return NextResponse.json({ message: 'Carte assignée avec succès et barrière ouverte', user }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur assignation carte:', error);
    return NextResponse.json({ error: 'Erreur interne lors de l\'assignation' }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const { cardId: rawCardId } = await req.json();
    const cardId = rawCardId ? normalizeCardId(rawCardId) : '';
    const candidates = rawCardId ? cardIdCandidates(rawCardId) : [];
    
    if (!cardId) {
      return NextResponse.json({ error: 'cardId requis' }, { status: 400 });
    }

    // 1. Trouver l'utilisateur actuel qui possède cette carte
    const userToRelease = await db.user.findFirst({
      where: { OR: candidates.map((value) => ({ cardId: value })) },
    });

    if (!userToRelease) {
      return NextResponse.json({ message: 'Carte déjà libre' }, { status: 200 });
    }

    const isInside = userToRelease.presenceStatus === 'IN';
    const parkingId = userToRelease.assignedParkingId;

    const queries: any[] = [];

    // 2. Libérer la place de parking
    if (isInside && parkingId) {
      queries.push(
        db.parkingZone.update({
          where: { id: parkingId },
          data: { currentCount: { decrement: 1 } },
        })
      );
    }

    // 3. Mettre à jour l'utilisateur (retrait de carte et passage à OUT)
    queries.push(
      db.user.update({
        where: { id: userToRelease.id },
        data: { 
          cardId: null,
          presenceStatus: 'OUT'
        }
      })
    );

    // 4. Créer le log de sortie
    if (isInside && parkingId) {
      queries.push(
        db.accessLog.create({
          data: {
            userId: userToRelease.id,
            userNameSnapshot: userToRelease.name || 'Inconnu',
            plateSnapshot: userToRelease.licensePlate || 'Inconnue',
            eventType: 'SORTIE',
            status: 'SUCCESS',
            parkingId: parkingId,
            source: 'PHONE',
          },
          include: { parking: true, user: true }
        })
      );
    }

    const results = await db.$transaction(queries);

    // 5. Émettre l'événement temps réel si une sortie a été enregistrée
    if (isInside && parkingId) {
      const exitLog = results[results.length - 1]; // Le log est la dernière requête
      socketService.emit('scan:new', exitLog);
    }

    return NextResponse.json({ message: 'Carte réinitialisée, sortie enregistrée et place libérée' }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur libération carte:', error);
    return NextResponse.json({ error: 'Erreur interne lors de la libération' }, { status: 500 });
  }
}

