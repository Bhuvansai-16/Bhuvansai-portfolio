// Pip: a Deep Agent on Groq. runAgent() turns one chat request into the events the browser reads.
import { createDeepAgent, registerHarnessProfile } from 'deepagents';
import { initChatModel } from 'langchain';
// initChatModel loads the provider by name at run time, which Vercel's file tracer can't follow;
// without this import @langchain/groq is left out of the deployed function and every call fails.
import '@langchain/groq';
import { actionTools, type Action } from './tools.ts';
import { seedFiles } from './files.ts';
import { SYSTEM_PROMPT } from './prompt.ts';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ErrorCode = 'rate_limited' | 'busy' | 'server';
export type AgentEvent = Action | { type: 'text'; delta: string } | { type: 'reset' } | { type: 'step'; label: string } | { type: 'done' } | { type: 'error'; code: ErrorCode };

// Of the Deep Agents built-ins Pip only needs to read its files; the rest cost ~1.2K tokens per call.
// The profile applies to models made with initChatModel(..., { modelProvider: 'groq' }).
registerHarnessProfile('groq', {
  excludedTools: ['ls', 'write_file', 'edit_file', 'delete', 'glob', 'execute', 'task'],
  generalPurposeSubagent: { enabled: false },
});

type Model = Parameters<typeof createDeepAgent>[0] extends infer P ? (P extends { model?: infer M } ? M : never) : never;
export const buildAgent = (model: Model) => createDeepAgent({ model, tools: actionTools, systemPrompt: SYSTEM_PROMPT });
type Agent = ReturnType<typeof buildAgent>;

const pip = new Map<string, Promise<Agent>>();
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_FALLBACKS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
const DEFAULT_MODEL_ORDER = [DEFAULT_MODEL, ...DEFAULT_FALLBACKS];

export function modelOrder(env: Record<string, string | undefined> = process.env) {
  const primary = env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  const fallbacks = (env.GROQ_FALLBACK_MODELS ?? DEFAULT_FALLBACKS.join(','))
    .split(',').map(name => name.trim()).filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

async function groqAgent(name: string): Promise<Agent> {
  let pending = pip.get(name);
  if (!pending) {
    pending = (async () => {
      const model = await initChatModel(name, {
        modelProvider: 'groq', apiKey: process.env.GROQ_API_KEY,
        temperature: 0.3, maxTokens: 400, maxRetries: 0, timeout: 20_000,
        reasoningEffort: /qwen/i.test(name) ? 'none' : 'low',
      });
      return buildAgent(model as Model);
    })();
    pip.set(name, pending);
  }
  try {
    return await pending;
  } catch (err) {
    pip.delete(name);
    throw err;
  }
}

const mainArg = (args: Record<string, unknown> = {}) => Object.entries(args).find(([k, v]) => k !== 'say' && typeof v === 'string')?.[1] ?? '';

function codeOf(err: unknown): ErrorCode {
  const e = err as { status?: number; message?: string } | undefined;
  const msg = e?.message ?? '';
  if (e?.status === 429 || /rate.?limit/i.test(msg)) return 'rate_limited';
  if ((e?.status ?? 0) >= 500 || /timeout|timed out|ECONN|fetch failed/i.test(msg)) return 'busy';
  return 'server';
}

// The model sometimes answers, offers ("Want me to take you there?") and acts in the same breath.
// When Pip's reply ends with a question, its action waits for the visitor's yes, unless they asked for it outright.
const ASKED_TO_ACT = /\b(show|open|go|take|bring|navigate|jump|scroll|switch|change|start|launch|copy|fill|send)\b/i;
const holdAction = (visitor: string, reply: string) => reply.trim().endsWith('?') && !ASKED_TO_ACT.test(visitor);

export async function* runAgent(messages: ChatMessage[], page: { section?: string }, signal?: AbortSignal, agent?: Agent | Agent[]): AsyncGenerator<AgentEvent> {
  const last = messages.length - 1;
  const turn = messages.map((m, i) => (i === last && page.section ? { ...m, content: `(The visitor is looking at the "${page.section}" section.)\n${m.content}` } : m));
  const injected = Array.isArray(agent) ? agent : agent ? [agent] : null;
  const models = injected ? DEFAULT_MODEL_ORDER.slice(0, injected.length) : modelOrder();
  for (let i = 0; i < models.length; i++) {
    const name = models[i];
    let reply = ''; // text of the model message whose tool calls are running now
    let responseStarted = false, actionEmitted = false;
    try {
      const graph = injected ? injected[i] : await groqAgent(name);
      const stream = await graph.stream({ messages: turn, files: seedFiles() } as never, { streamMode: ['messages', 'custom', 'updates'], recursionLimit: 8, signal });
      for await (const [mode, chunk] of stream as AsyncIterable<[string, any]>) {
        if (mode === 'custom') {
          const event = holdAction(messages[last]?.content ?? '', reply) ? { type: 'step', label: 'waiting for your yes' } : chunk as Action;
          if (event.type === 'action') { responseStarted = true; actionEmitted = true; }
          yield event as AgentEvent;
        } else if (mode === 'messages') {
          const [msg, meta] = chunk;
          if (meta?.langgraph_node === 'model_request' && typeof msg.content === 'string' && msg.content) {
            reply += msg.content;
            responseStarted = true;
            yield { type: 'text', delta: msg.content };
          }
        } else if (mode === 'updates') {
          for (const m of chunk.model_request?.messages ?? []) for (const call of m.tool_calls ?? []) yield { type: 'step', label: `${call.name} ${mainArg(call.args)}`.trim() };
          if (chunk.tools) reply = ''; // tools ran; the next model message starts fresh
        }
      }
      yield { type: 'done' };
      return;
    } catch (err) {
      if (signal?.aborted) return;
      console.error(`[pip] ${models[i]} failed:`, (err as Error)?.message ?? err); // shows in the host's function logs
      if ((err as Error)?.name === 'GraphRecursionError') {
        yield { type: 'text', delta: 'I got lost there. Try rephrasing?' };
        yield { type: 'done' };
        return;
      }
      if (!actionEmitted && i < models.length - 1) {
        if (responseStarted) yield { type: 'reset' };
        yield { type: 'step', label: `model failed; trying ${models[i + 1]}` };
        continue;
      }
      if (responseStarted) yield { type: 'reset' };
      yield { type: 'error', code: codeOf(err) };
      return;
    }
  }
}
