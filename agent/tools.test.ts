import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionTools } from './tools.ts';
import { LINKS, TARGETS } from '../src/lib/links.js';

const byName = Object.fromEntries(actionTools.map(t => [t.name, t]));

async function run(name: string, input: object) {
  const seen: unknown[] = [];
  await byName[name].invoke(input as never, { writer: (c: unknown) => seen.push(c) } as never);
  return seen;
}

test('every action ends the turn, so a pure action costs one model call', () => {
  for (const t of actionTools) assert.equal(t.returnDirect, true, t.name);
});

test('an action reaches the browser through the stream writer, with say trimmed', async () => {
  assert.deepEqual(await run('navigate_to', { target: 'project:maira', say: "  Here's MAIRA!  " }),
    [{ type: 'action', name: 'navigate_to', args: { target: 'project:maira' }, say: "Here's MAIRA!" }]);
});

test('say is capped at 80 characters', async () => {
  const [event] = await run('start_tour', { say: 'x'.repeat(200) }) as { say: string }[];
  assert.equal(event.say.length, 80);
});

test('a URL the model made up is rejected before anything runs', async () => {
  const seen: unknown[] = [];
  await assert.rejects(byName.open_link.invoke({ link: 'https://evil.example', say: 'hi' }, { writer: (c: unknown) => seen.push(c) } as never));
  assert.equal(seen.length, 0);
});

test('tool enums match the browser maps exactly', () => {
  const options = (name: string, key: string) => [...(byName[name].schema as any).shape[key].options].sort();
  assert.deepEqual(options('navigate_to', 'target'), Object.keys(TARGETS).sort());
  assert.deepEqual(options('open_link', 'link'), Object.keys(LINKS).sort());
});
