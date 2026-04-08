import { NextRequest, NextResponse } from 'next/server';
import { getState, mergeClientData } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  logReq(req, body);

  mergeClientData(roomId, {
    participants: body.participants,
    votingStartedAt: body.votingStartedAt,
    votes: body.votes,
  });

  const state = getState(roomId);
  logRes(req, state);
  return NextResponse.json(state);
}
