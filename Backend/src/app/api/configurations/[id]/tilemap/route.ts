import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const config = await db.configuration.findUnique({
      where: { id },
      include: { tilemap: true },
    });

    if (!config || !config.tilemap) {
      return NextResponse.json({ gridData: null });
    }

    return NextResponse.json(config.tilemap);
  } catch (error) {
    console.error('[TILEMAP_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: configId } = await params;
    const body = await req.json();
    const { gridData, width, height, name } = body;

    // 1. Sauvegarder ou mettre à jour la Tilemap
    const config = await db.configuration.findUnique({
      where: { id: configId },
      include: { tilemap: true },
    });

    if (!config) {
      return new NextResponse('Configuration not found', { status: 404 });
    }

    let tilemap;
    if (config.tilemapId) {
      tilemap = await db.tilemap.update({
        where: { id: config.tilemapId },
        data: { gridData, width, height, name: name || 'Carte de ' + config.name },
      });
    } else {
      tilemap = await db.tilemap.create({
        data: {
          gridData,
          width: width || 20,
          height: height || 20,
          name: name || 'Carte de ' + config.name,
          configuration: { connect: { id: configId } },
        },
      });
    }

    // 2. Synchroniser les zones de parking (Logique Métier)
    // On parcourt la grille pour trouver toutes les tuiles de type 'PARKING'
    const parkingTiles: any[] = [];
    const grid = gridData as any[][];
    
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.type === 'PARKING' && cell.parkingName) {
          parkingTiles.push({
            name: cell.parkingName,
            capacity: cell.capacity || 0,
            type: cell.parkingType || 'VISITOR',
          });
        }
      });
    });

    // On récupère les zones existantes pour cette config
    const existingZones = await db.parkingZone.findMany({
      where: { configurationId: configId },
    });

    // Pour chaque parking trouvé sur la carte, on crée ou on met à jour
    for (const tile of parkingTiles) {
      const existing = existingZones.find(z => z.name === tile.name);
      if (existing) {
        await db.parkingZone.update({
          where: { id: existing.id },
          data: { capacity: tile.capacity },
        });
      } else {
        await db.parkingZone.create({
          data: {
            name: tile.name,
            capacity: tile.capacity,
            type: tile.type,
            configurationId: configId,
          },
        });
      }
    }

    // Optionnel: Supprimer les zones qui ne sont plus sur la carte ?
    // Pour l'instant on garde pour éviter les pertes de données accidentelles.

    return NextResponse.json(tilemap);
  } catch (error) {
    console.error('[TILEMAP_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
