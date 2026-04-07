import { NextRequest, NextResponse } from 'next/server';
import { startVoting } from '@/lib/store';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const state = startVoting(roomId);
  return NextResponse.json(state);
}
