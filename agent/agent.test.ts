import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { buildAgent, modelOrder, runAgent, type AgentEvent } from './agent.ts';

// A stand-in for Groq: replays scripted replies (or throws) and remembers what it was sent.
class Scripted extends BaseChatModel {
  script: (AIMessage | Error)[];
  calls = 0;
  seen: BaseMessage[][] = [];
  constructor(script: (AIMessage | Error)[]) { super({ maxRetries: 0 }); this.script = script; }
  _llmType() { return 'scripted'; }
  bindTools() { return this as never; }
  async _generate(messages: BaseMessage[]) {
    this.seen.push(messages);
    const next = this.script[Math.min(this.calls++, this.script.length - 1)];
    if (next instanceof Error) throw next;
    // a fresh message each call: reusing one instance (and its tool-call ids) makes the graph merge instead of append
    const message = new AIMessage({ content: next.content, tool_calls: (next.tool_calls ?? []).map(t => ({ ...t, id: `call_${this.calls}` })) });
    return { generations: [{ text: typeof next.content === 'string' ? next.content : '', message }] };
  }
}

const call = (name: string, args: object) => new AIMessage({ content: '', tool_calls: [{ id: `c${Math.random()}`, name, args, type: 'tool_call' }] });

test('Groq models are tried in primary then backup order', () => {
  assert.deepEqual(modelOrder({}), ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']);
  assert.deepEqual(modelOrder({ GROQ_MODEL: 'openai/gpt-oss-120b', GROQ_FALLBACK_MODELS: 'openai/gpt-oss-20b, qwen/qwen3.8-27b,openai/gpt-oss-20b' }),
    ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']);
});

async function collect(model: Scripted, text = 'hi', section?: string) {
  const events: AgentEvent[] = [];
  for await (const e of runAgent([{ role: 'user', content: text }], { section }, undefined, buildAgent(model as never))) events.push(e);
  return events;
}

test('a page action streams a trace step, the action, then done, after one model call', async () => {
  const model = new Scripted([call('navigate_to', { target: 'project:maira', say: "Here's MAIRA!" }), new AIMessage('should not be reached')]);
  assert.deepEqual(await collect(model), [
    { type: 'step', label: 'navigate_to project:maira' },
    { type: 'action', name: 'navigate_to', args: { target: 'project:maira' }, say: "Here's MAIRA!" },
    { type: 'done' },
  ]);
  assert.equal(model.calls, 1);
});

test('a plain answer streams as text', async () => {
  const events = await collect(new Scripted([new AIMessage('MAIRA is a research platform.')]));
  assert.deepEqual(events, [{ type: 'text', delta: 'MAIRA is a research platform.' }, { type: 'done' }]);
});

test('the agent can read its files before answering', async () => {
  const model = new Scripted([call('read_file', { file_path: '/projects/maira.md' }), new AIMessage('Found it.')]);
  const events = await collect(model);
  assert.deepEqual(events[0], { type: 'step', label: 'read_file /projects/maira.md' });
  assert.match(JSON.stringify(model.seen[1].at(-1)?.content), /MAIRA/);
});

test('the current section reaches the model with the question', async () => {
  const model = new Scripted([new AIMessage('ok')]);
  await collect(model, 'show me projects', 'work');
  assert.match(String(model.seen[0].at(-1)?.content), /looking at the "work" section/);
});

test('a Groq rate limit becomes an error event the browser falls back on', async () => {
  const limit = Object.assign(new Error('Rate limit reached for model'), { status: 429 });
  assert.deepEqual(await collect(new Scripted([limit])), [{ type: 'error', code: 'rate_limited' }]);
});

test('a failed model hands the request to the next model', async () => {
  const first = new Scripted([Object.assign(new Error('Unavailable'), { status: 503 })]);
  const backup = new Scripted([new AIMessage('Backup answer.')]);
  const events: AgentEvent[] = [];
  for await (const event of runAgent([{ role: 'user', content: 'Hi' }], {}, undefined, [buildAgent(first as never), buildAgent(backup as never)])) events.push(event);
  assert.deepEqual(events, [
    { type: 'step', label: 'model failed; trying openai/gpt-oss-20b' },
    { type: 'text', delta: 'Backup answer.' },
    { type: 'done' },
  ]);
  assert.equal(first.calls, 1);
  assert.equal(backup.calls, 1);
});

test('an agent that loops past the step limit says so instead of failing', async () => {
  const events = await collect(new Scripted([call('read_file', { file_path: '/about.md' })]));
  assert.deepEqual(events.slice(-2), [{ type: 'text', delta: 'I got lost there. Try rephrasing?' }, { type: 'done' }]);
});

// The model sometimes answers, offers to show the place, and acts in the same breath.
const answerAndAct = () => new AIMessage({
  content: 'At AllCognix my boss built four AI products. Want me to take you there?',
  tool_calls: [{ id: 'c1', name: 'navigate_to', args: { target: 'job:allcognix-intern', say: 'Here it is!' }, type: 'tool_call' }],
});

test('after answering with an offer, Pip waits for a yes instead of acting', async () => {
  const events = await collect(new Scripted([answerAndAct()]), 'What did you build at AllCognix?');
  assert.equal(events.some(e => e.type === 'action'), false);
  assert.deepEqual(events.slice(-2), [{ type: 'step', label: 'waiting for your yes' }, { type: 'done' }]);
  assert.match(events.filter(e => e.type === 'text').map(e => (e as { delta: string }).delta).join(''), /take you there\?$/);
});

test('when the visitor asked to be shown, Pip acts even if it also asked something', async () => {
  const events = await collect(new Scripted([answerAndAct()]), 'Show me AllCognix');
  assert.ok(events.some(e => e.type === 'action' && e.name === 'navigate_to'));
});
