import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from './github.ts';

const get = () => new Request('https://pip.vercel.app/api/github');
const CAL = { total: { 2026: 3 }, contributions: [{ date: '2026-10-08', count: 3, level: 2 }] };

test('only GET, and only with a token', async () => {
  assert.equal((await handle(new Request('https://pip.vercel.app/api/github', { method: 'POST' }))).status, 405);
  delete process.env.PUBLIC_GITHUB_TOKEN;
  assert.equal((await handle(get())).status, 503);
});

test('serves the calendar with a CDN cache header and asks GitHub at most once per 10 minutes', async () => {
  process.env.PUBLIC_GITHUB_TOKEN = 'test-token';
  let calls = 0;
  const fake = async () => { calls++; return CAL; };
  const res = await handle(get(), fake, 1_000);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control') ?? '', /s-maxage=600/);
  assert.deepEqual(await res.json(), CAL);
  await handle(get(), fake, 1_000 + 9 * 60_000);
  assert.equal(calls, 1);
  await handle(get(), fake, 1_000 + 11 * 60_000);
  assert.equal(calls, 2);
});

test('a GitHub failure is a 502, so the page falls back to its file', async () => {
  process.env.PUBLIC_GITHUB_TOKEN = 'test-token';
  const res = await handle(get(), async () => { throw new Error('boom'); }, 10 ** 12);
  assert.equal(res.status, 502);
});
