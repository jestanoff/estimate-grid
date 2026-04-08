import { NextRequest, NextResponse } from 'next/server';
import { getState, subscribe, roomExists } from '@/lib/store';
import { logRes } from '@/lib/debug';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  if (!roomExists(roomId)) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately on connect
      const initial = getState(roomId);
      logRes(req, initial);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

      // Push state to this client on every mutation
      const unsubscribe = subscribe(roomId, (state) => {
        try {
          logRes(req, state);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive comment every 25s to prevent proxies closing the connection
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 25000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
