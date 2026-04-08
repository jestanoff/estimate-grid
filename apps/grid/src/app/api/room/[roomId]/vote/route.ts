import { NextRequest, NextResponse } from 'next/server';
import { vote, mergeClientData } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  logReq(req, body);
  const { participantId, emoji, cell, x, y, votingStartedAt, participants } = body;

  if (!participantId || !emoji || !cell || x == null || y == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (participants) {
    mergeClientData(roomId, { participants, votingStartedAt });
  }

  const state = vote(roomId, { participantId, emoji, cell, x, y }, votingStartedAt);
  logRes(req, state);
  return NextResponse.json(state);
}
