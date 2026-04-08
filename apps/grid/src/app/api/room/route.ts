import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/store';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateId(): string {
  let id = '';
  for (let i = 0; i < 3; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminId } = body;

  if (!adminId) {
    return NextResponse.json({ error: 'Missing adminId' }, { status: 400 });
  }

  const roomId = generateId();
  createRoom(roomId, adminId);
  return NextResponse.json({ roomId });
}
