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

    // Contrôle de capacité
    if (targetParking.currentCount >= targetParking.capacity) {
      return NextResponse.json(
        { error: `Le parking ${targetParking.name} est complet (${targetParking.currentCount}/${targetParking.capacity}).` }, 
        { status: 403 }
      );
    }

    // 4. Créer ou Mettre à jour l'utilisateur et le log d'accès (Transaction)
    const [user, log, updatedParking] = await db.$transaction([
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
      db.parkingZone.update({
        where: { id: targetParking.id },
        data: { currentCount: { increment: 1 } },
      }),
    ]);
    
    // Associer l'userId au log après création (car on ne pouvait pas le faire dans l'array transaction directement pour un nouvel user)
    const finalLog = await db.accessLog.update({
      where: { id: log.id },
      data: { userId: user.id },
      include: { parking: true, user: true },
    });

    // 4. Émettre le log pour l'afficher en direct dans l'historique
    socketService.emit('scan:new', finalLog);

    return NextResponse.json({ message: 'Carte assignée avec succès', user }, { status: 201 });
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

    // Retirer la carte à l'utilisateur
    await db.user.updateMany({
      where: { OR: candidates.map((value) => ({ cardId: value })) },
      data: { cardId: null }
    });

    return NextResponse.json({ message: 'Carte réinitialisée et libérée avec succès' }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur libération carte:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

