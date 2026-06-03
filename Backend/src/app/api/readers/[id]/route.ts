import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.cardReader.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[READER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
