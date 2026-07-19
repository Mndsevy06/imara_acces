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
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Record already deleted or does not exist
      return new NextResponse(null, { status: 204 });
    }
    console.error('[READER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { label, location, type } = body;

    const reader = await db.cardReader.update({
      where: { id },
      data: {
        label,
        location,
        type,
      },
    });

    return NextResponse.json(reader);
  } catch (error) {
    console.error('[READER_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
