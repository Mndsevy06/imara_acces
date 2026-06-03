import { NextResponse } from 'next/server';

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
  if (command === 'OPEN') {
    // Supprimer la commande une fois consommée par l'ESP32
    globalStore.pendingCommands.delete(readerId);
    return NextResponse.json({ command: 'OPEN' });
  }

  return NextResponse.json({ command: 'NONE' });
}
