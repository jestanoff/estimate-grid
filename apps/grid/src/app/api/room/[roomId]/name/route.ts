import { NextRequest, NextResponse } from 'next/server';
import { setName } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  logReq(req, body);
  const { participantId, name } = body;

  if (!participantId || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const state = setName(roomId, participantId, name);
  logRes(req, state);
  return NextResponse.json(state);
}
