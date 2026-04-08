import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Deprecated — use /state' }, { status: 410 });
}
