import { NextRequest, NextResponse } from 'next/server';
import { setName } from '@/lib/store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  const { participantId, name } = body;

  if (!participantId || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const state = setName(roomId, participantId, name);
  return NextResponse.json(state);
}
