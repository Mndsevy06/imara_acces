import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const { name, licensePlate, cardId: rawCardId } = await req.json();
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

    // Créer l'utilisateur temporaire (Visiteur / Adhérent Temporaire)
    const visitor = await db.user.create({
      data: {
        name: name || 'Adhérent Temporaire',
        licensePlate: licensePlate || 'INCONNU', 
        role: 'MEMBER',
        profile: null, // Utilisateur sans profil = visiteur
        cardId: cardId,
      }
    });

    return NextResponse.json({ message: 'Carte assignée avec succès', visitor }, { status: 201 });
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

