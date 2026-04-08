import { NextRequest, NextResponse } from 'next/server';
import { getState, mergeClientData } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();

  mergeClientData(roomId, {
    participants: body.participants,
    names: body.names,
    votingStartedAt: body.votingStartedAt,
    votes: body.votes,
  });

  return NextResponse.json(getState(roomId));
}
