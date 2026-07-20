import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const readerId = searchParams.get('readerId');

  if (!readerId) {
    return NextResponse.json({ error: 'readerId is required' }, { status: 400 });
  }

  const globalStore = global as any;
  if (!globalStore.pendingCommands) {
    globalStore.pendingCommands = new Map<string, string>();
  }

  const command = globalStore.pendingCommands.get(readerId);
  const universalCommand = globalStore.pendingCommands.get('ALL');

  // Vérifier les commandes dans cet ordre : OPEN, RED, NONE
  if (command === 'OPEN' || universalCommand === 'OPEN') {
    // Supprimer la commande une fois consommée par l'ESP32
    globalStore.pendingCommands.delete(readerId);
    globalStore.pendingCommands.delete('ALL');
    return NextResponse.json({ command: 'OPEN' });
  }

  if (command === 'RED' || universalCommand === 'RED') {
    // Supprimer la commande une fois consommée par l'ESP32
    globalStore.pendingCommands.delete(readerId);
    globalStore.pendingCommands.delete('ALL');
    return NextResponse.json({ command: 'RED' });
  }

  return NextResponse.json({ command: 'NONE' });
}
