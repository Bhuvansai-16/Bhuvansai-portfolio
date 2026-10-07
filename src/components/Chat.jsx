import { useEffect, useRef, useState } from 'react';
import { goTo, scroller } from '../lib/motion';
import { askAgent, plain, trimHistory } from '../lib/agent';
import { answerLocal } from '../lib/kb';
import { PROFILE } from '../content';
import PipAvatar from './PipAvatar';
import { Icon } from './ui';

// Visitors talk to Pip about the owner, so the starters ask Pip, not the owner.
const SUGGESTED = [
  `What has ${PROFILE.name} built?`,
  `What did ${PROFILE.name} work on at AllCognix?`,
  `Can you open ${PROFILE.name}'s LinkedIn?`,
  'Can you switch to dark mode?',
];
const STATUS = { idle: 'ready', thinking: 'thinking…', acting: 'on it…' };

export default function Chat({ open, setOpen, section, theme, onAction, onSendEmail, onStatus }) {
  const [msgs, setMsgs] = useState([]); // { id, role: 'user' | 'assistant', text, src?, pending?, emailDraft?, emailState? }
  const [status, setStatus] = useState('idle');
  const logRef = useRef(null), inputRef = useRef(null), wasOpen = useRef(false), running = useRef(false);

  useEffect(() => { try { sessionStorage.removeItem('pip-chat'); } catch { /* private mode */ } }, []);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      scroller.lenis?.stop();
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
    scroller.lenis?.start();
    if (wasOpen.current) document.getElementById('pipBtn')?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => { logRef.current.scrollTop = logRef.current.scrollHeight; }, [msgs]);
  useEffect(() => { onStatus(status); }, [status, onStatus]);

  async function ask(q) {
    q = q.trim();
    if (!q || running.current) return; // one reply at a time, so replies never interleave
    running.current = true;
    const id = Date.now();
    const history = trimHistory([...msgs.map(m => ({ role: m.role, content: m.text })), { role: 'user', content: q }]);
    const patch = f => setMsgs(all => all.map(m => (m.id === id ? { ...m, ...f(m) } : m)));
    setMsgs(all => [...all, { id: id - 1, role: 'user', text: q }, { id, role: 'assistant', text: '', pending: true }]);
    setStatus('thinking');
    let failed = false;
    await askAgent({
      messages: history,
      page: { section },
      onEvent: e => {
        if (e.type === 'text') patch(m => ({ text: m.text + e.delta }));
        else if (e.type === 'reset') patch(() => ({ text: '' }));
        else if (e.type === 'action') {
          if (e.name === 'send_email') {
            patch(() => ({ text: 'Review this email. Nothing is sent until you confirm below.', emailDraft: e.args, emailState: 'confirming' }));
            return;
          }
          setStatus('acting');
          patch(m => ({ text: m.text || e.say }));
          onAction(e);
        } else if (e.type === 'error') failed = true;
      },
    });
    if (failed) {
      const local = answerLocal(q);
      patch(() => ({ text: local.text, src: local.src }));
    }
    patch(m => ({ text: plain(m.text) || 'I came up empty there. Try asking another way?', pending: false }));
    setStatus('idle');
    running.current = false;
  }

  async function sendDraft(id, draft) {
    if (running.current) return;
    running.current = true;
    setStatus('acting');
    try {
      await onSendEmail(draft);
      setMsgs(all => all.map(m => m.id === id ? { ...m, text: 'Email sent successfully.', emailDraft: null, emailState: 'sent' } : m));
    } catch {
      setMsgs(all => all.map(m => m.id === id ? { ...m, text: "That email didn't send. You can retry or cancel.", emailState: 'error' } : m));
    } finally {
      setStatus('idle');
      running.current = false;
    }
  }

  function cancelDraft(id) {
    setMsgs(all => all.map(m => m.id === id ? { ...m, text: 'Email cancelled. Nothing was sent.', emailDraft: null, emailState: 'cancelled' } : m));
  }

  return (
    <aside className={`chat${open ? ' open' : ''}`} id="chat" aria-label="Chat with Pip" data-lenis-prevent>
      <header>
        <div className="chat-id">
          <PipAvatar size={40} status={status} theme={theme} />
          <div><h2>Pip</h2><p className="mono muted">{STATUS[status]}</p></div>
        </div>
        <div className="chat-actions">
          <button type="button" className="chat-new" onClick={() => { setMsgs([]); if (inputRef.current) inputRef.current.value = ''; }} disabled={status !== 'idle'}>New chat</button>
          <button type="button" className="nav-icon" aria-label="Close chat" onClick={() => setOpen(false)}>✕</button>
        </div>
      </header>
      <div className="chat-log" aria-live="polite" ref={logRef}>
        {!msgs.length && (
          <div className="suggest">{SUGGESTED.map(s => <button type="button" key={s} onClick={() => ask(s)}>{s}</button>)}</div>
        )}
        {msgs.map(m => (m.role === 'user' ? <div key={m.id} className="msg q">{m.text}</div> : (
          <div key={m.id} className="msg a">
            <p>{m.text || (m.pending && <span className="typing" aria-label="Pip is typing"><i /><i /><i /></span>)}</p>
            {m.emailDraft && (
              <>
                <div className="email-review" aria-label="Email draft">
                  <div><span>To</span><strong>{PROFILE.email}</strong></div>
                  <div><span>From</span><strong>{m.emailDraft.name} · {m.emailDraft.email}</strong></div>
                  <p>{m.emailDraft.message}</p>
                </div>
                <div className="email-review-actions">
                  <button type="button" className="btn dark sm" onClick={() => sendDraft(m.id, m.emailDraft)} disabled={status !== 'idle'}>{status === 'acting' ? 'Sending…' : m.emailState === 'error' ? 'Retry email' : 'Send email'}</button>
                  <button type="button" className="email-cancel" onClick={() => cancelDraft(m.id)} disabled={status !== 'idle'}>Cancel</button>
                </div>
              </>
            )}
            {!m.pending && m.src?.map(s => (
              <button key={s} type="button" className="src" onClick={() => { setOpen(false); goTo('#' + s); }}>{s} ↗</button>
            ))}
          </div>
        )))}
      </div>
      <form className="chat-form" onSubmit={e => { e.preventDefault(); ask(inputRef.current.value); inputRef.current.value = ''; }}>
        <label className="sr" htmlFor="chatInput">Ask Pip a question</label>
        <input id="chatInput" placeholder="Ask Pip…" autoComplete="off" maxLength={1000} ref={inputRef} />
        <button className="btn dark sm" type="submit" aria-label="Send" disabled={status !== 'idle'}><Icon id="arrow" /></button>
      </form>
    </aside>
  );
}
