import { NextRequest, NextResponse } from 'next/server';
import { getState, mergeParticipants } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const body = await req.json();
  const { participants, names } = body;

  // Merge client-known participant data into this instance's room
  if (participants && names) {
    mergeParticipants(roomId, participants, names);
  }

  return NextResponse.json(getState(roomId));
}
