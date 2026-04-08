import { NextRequest, NextResponse } from 'next/server';
import { createRoom, roomExists } from '@/lib/store';
import { logReq, logRes } from '@/lib/debug';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_RETRIES = 10;

function generateId(): string {
  let id = '';
  for (let i = 0; i < 3; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  logReq(req, body);
  const { adminId } = body;

  if (!adminId) {
    return NextResponse.json({ error: 'Missing adminId' }, { status: 400 });
  }

  let roomId = generateId();
  let retries = 0;
  while (roomExists(roomId) && retries < MAX_RETRIES) {
    roomId = generateId();
    retries++;
  }

  if (roomExists(roomId)) {
    return NextResponse.json({ error: 'Could not generate unique room ID' }, { status: 503 });
  }

  createRoom(roomId, adminId);
  const res = { roomId };
  logRes(req, res);
  return NextResponse.json(res);
}
