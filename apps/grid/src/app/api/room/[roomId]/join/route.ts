import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  logReq(req, body);
  const { participantId, name, emoji: preferredEmoji } = body;

  if (!participantId) {
    return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
  }

  const { emoji } = joinRoom(roomId, participantId, name || undefined, preferredEmoji || undefined);
  const res = { emoji };
  logRes(req, res);
  return NextResponse.json(res);
}
