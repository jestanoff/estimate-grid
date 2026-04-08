import { NextRequest, NextResponse } from 'next/server';
import { startVoting } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  logReq(req, { roomId });
  const state = startVoting(roomId);
  logRes(req, state);
  return NextResponse.json(state);
}
