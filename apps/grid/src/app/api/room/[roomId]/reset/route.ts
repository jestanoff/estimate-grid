import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Deprecated — use /start' }, { status: 410 });
}
