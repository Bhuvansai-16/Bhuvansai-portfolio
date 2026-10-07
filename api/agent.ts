// POST /api/agent: one chat turn in, Pip's events out as a text/event-stream.
import { runAgent, type AgentEvent, type ChatMessage } from '../agent/agent.ts';
import { SECTIONS } from '../src/lib/links.js';

type Input = { messages: ChatMessage[]; page: { section?: string } };

const MAX_MESSAGES = 10, MAX_CHARS = 1000, PER_MINUTE = 10;
const hits = new Map<string, number[]>(); // ponytail: per-instance memory; add a Vercel Firewall rate-limit rule if it gets abused

export function validate(body: unknown): Input | null {
  const b = body as { messages?: unknown; page?: { section?: unknown } } | null;
  const msgs = b?.messages;
  if (!Array.isArray(msgs) || msgs.length < 1 || msgs.length > MAX_MESSAGES) return null;
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim() || m.content.length > MAX_CHARS) return null;
  }
  if (msgs[msgs.length - 1].role !== 'user') return null;
  const section = b?.page?.section;
  return {
    messages: msgs.map(m => ({ role: m.role, content: m.content })),
    page: { section: typeof section === 'string' && SECTIONS.includes(section) ? section : undefined }, // never echo free text into the prompt
  };
}

export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > PER_MINUTE;
}

// Browsers send Origin on every POST, so a request without one is a bare script; other websites are refused too.
// This only stops casual quota draining (headers can be forged); the real limit is a platform rate-limit rule.
export function allowedOrigin(origin: string | null, url: string): boolean {
  if (!origin) return false;
  try {
    const o = new URL(origin);
    return o.host === new URL(url).host || o.hostname === 'localhost' || o.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

const SSE_HEADERS = { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' };

export async function handle(req: Request, run = runAgent): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!allowedOrigin(req.headers.get('origin'), req.url)) return new Response('Forbidden', { status: 403 });
  if (rateLimited(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local')) return new Response('Too many requests', { status: 429 });
  const input = validate(await req.json().catch(() => null));
  if (!input) return new Response('Bad request', { status: 400 });
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      try {
        for await (const e of run(input.messages, input.page, req.signal)) ctrl.enqueue(enc.encode(`data: ${JSON.stringify(e satisfies AgentEvent)}\n\n`));
        ctrl.close();
      } catch {
        // the visitor closed the tab mid-reply; nothing left to send
      }
    },
  });
  return new Response(body, { headers: SSE_HEADERS });
}

export default { fetch: (req: Request) => handle(req) };
