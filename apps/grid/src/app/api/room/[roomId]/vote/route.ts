import { NextRequest, NextResponse } from 'next/server';
import { vote, mergeParticipants } from '@/lib/store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  const { participantId, emoji, cell, x, y, votingStartedAt, participants, names } = body;

  if (!participantId || !emoji || !cell || x == null || y == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (participants && names) {
    mergeParticipants(roomId, participants, names);
  }

  const state = vote(roomId, { participantId, emoji, cell, x, y }, votingStartedAt);
  return NextResponse.json(state);
}
