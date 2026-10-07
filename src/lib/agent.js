// Pip in the browser: send the conversation to /api/agent and read its event stream back.
const MAX_MESSAGES = 10, MAX_CHARS = 1000;
const STATUS = { 400: 'bad_request', 429: 'rate_limited' };

// The server takes at most 10 non-empty messages of up to 1,000 characters each.
export const trimHistory = messages => messages
  .filter(m => m.content.trim())
  .slice(-MAX_MESSAGES)
  .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

// Models sometimes answer in markdown despite the prompt; the chat shows plain text.
export const plain = s => s.replace(/\*\*|__|`/g, '').replace(/^#+\s*/gm, '').trim();

// Server-sent events arrive in arbitrary chunks: buffer until a blank line ends each event.
export function createParser(onEvent) {
  let buf = '';
  return text => {
    buf += text;
    for (let i; (i = buf.indexOf('\n\n')) >= 0;) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try { onEvent(JSON.parse(line.slice(6))); } catch { /* skip a malformed event, keep the rest */ }
      }
    }
  };
}

export async function askAgent({ messages, page, onEvent, signal }) {
  try {
    const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, page }), signal });
    if (!res.ok || !res.body) return onEvent({ type: 'error', code: STATUS[res.status] ?? 'busy' });
    const feed = createParser(onEvent), reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      feed(value);
    }
  } catch {
    if (!signal?.aborted) onEvent({ type: 'error', code: 'busy' });
  }
}
