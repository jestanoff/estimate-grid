const DEBUG = process.env.DEBUG_API === 'true';

export function logReq(req: { method: string; url: string }, body: unknown): void {
  if (!DEBUG) return;
  const { pathname } = new URL(req.url);
  console.log(`[API →] ${req.method} ${pathname}`, JSON.stringify(body, null, 2));
}

export function logRes(req: { method: string; url: string }, data: unknown): void {
  if (!DEBUG) return;
  const { pathname } = new URL(req.url);
  console.log(`[API ←] ${req.method} ${pathname}`, JSON.stringify(data, null, 2));
}
