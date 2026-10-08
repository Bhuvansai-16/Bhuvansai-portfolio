// GET /api/github: the contribution calendar, fresh from GitHub. The token stays on the server.
// Vercel's CDN keeps each answer for 10 minutes (and a warm instance remembers it too), so visitors
// never wait on GitHub and the token's rate limit is never at risk. The page falls back to
// public/data/github.json when this fails or the token isn't set.
import { PROFILE } from '../src/content.js';
import { fetchCalendar } from '../src/lib/githubCalendar.js';

const TTL = 10 * 60_000;
let memo: { at: number; body: string } | null = null;

export async function handle(req: Request, fetchCal = fetchCalendar, now = Date.now()): Promise<Response> {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const token = process.env.PUBLIC_GITHUB_TOKEN;
  if (!token) return new Response('Not configured', { status: 503 });
  try {
    if (!memo || now - memo.at > TTL) memo = { at: now, body: JSON.stringify(await fetchCal(token, PROFILE.github)) };
    return new Response(memo.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' } });
  } catch (err) {
    console.error('[github]', (err as Error)?.message ?? err);
    return new Response('GitHub unavailable', { status: 502 });
  }
}

export default { fetch: (req: Request) => handle(req) };
