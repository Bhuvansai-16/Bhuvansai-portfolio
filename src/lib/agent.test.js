import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askAgent, createParser, plain, trimHistory } from './agent.js';

test('events split across chunks still arrive whole and in order', () => {
  const seen = [];
  const feed = createParser(e => seen.push(e));
  feed('data: {"type":"te');
  feed('xt","delta":"Hi"}\n');
  feed('\ndata: {"type":"done"}\n\n');
  assert.deepEqual(seen, [{ type: 'text', delta: 'Hi' }, { type: 'done' }]);
});

test('a malformed event is skipped without losing the next one', () => {
  const seen = [];
  createParser(e => seen.push(e))('data: {oops\n\ndata: {"type":"done"}\n\n');
  assert.deepEqual(seen, [{ type: 'done' }]);
});

test('history sent to the server stays inside its limits', () => {
  const long = Array.from({ length: 14 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: i === 13 ? 'x'.repeat(1600) : `m${i}` }));
  long.splice(3, 0, { role: 'assistant', content: '   ' });
  const out = trimHistory(long);
  assert.equal(out.length, 10);
  assert.equal(out.at(-1).content.length, 1000);
  assert.ok(out.every(m => m.content.trim()));
});

test('markdown the model slips in is shown as plain text', () => {
  assert.equal(plain('## MAIRA\n**Multi-agent** `research`'), 'MAIRA\nMulti-agent research');
});

test('a rate-limited server becomes an error event, so the chat can fall back', async () => {
  globalThis.fetch = async () => new Response('Too many requests', { status: 429 });
  const seen = [];
  await askAgent({ messages: [], page: {}, onEvent: e => seen.push(e) });
  assert.deepEqual(seen, [{ type: 'error', code: 'rate_limited' }]);
});

test('no network becomes a busy error, an aborted request stays quiet', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  const seen = [];
  await askAgent({ messages: [], page: {}, onEvent: e => seen.push(e) });
  const ac = new AbortController();
  ac.abort();
  await askAgent({ messages: [], page: {}, onEvent: e => seen.push(e), signal: ac.signal });
  assert.deepEqual(seen, [{ type: 'error', code: 'busy' }]);
});

test('a streamed reply is read to the end', async () => {
  globalThis.fetch = async () => new Response('data: {"type":"text","delta":"Hi"}\n\ndata: {"type":"done"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  const seen = [];
  await askAgent({ messages: [], page: {}, onEvent: e => seen.push(e) });
  assert.deepEqual(seen, [{ type: 'text', delta: 'Hi' }, { type: 'done' }]);
});
