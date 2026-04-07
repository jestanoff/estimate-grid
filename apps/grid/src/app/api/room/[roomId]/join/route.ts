import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  const { participantId, name } = body;

  if (!participantId) {
    return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
  }

  const { emoji } = joinRoom(roomId, participantId, name || undefined);
  return NextResponse.json({ emoji });
}
