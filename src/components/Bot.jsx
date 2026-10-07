import { useEffect } from 'react';
import PipAvatar from './PipAvatar';

export const BOT_SIZE = matchMedia('(max-width: 520px)').matches ? 64 : 72;

// Pip in the corner: opens the chat, and pops a speech bubble when it does something on the page.
export default function Bot({ open, onToggle, status, theme, bubble, onDismiss }) {
  useEffect(() => {
    if (!bubble) return;
    const live = document.getElementById('announce');
    if (live) live.textContent = `Pip: ${bubble.text}`;
    if (bubble.button) return; // a bubble with a button waits for the visitor
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [bubble, onDismiss]);

  return (
    <div className="bot">
      {bubble && (
        <div className="bot-bubble" key={bubble.id}>
          <p>{bubble.text}</p>
          {bubble.button?.href && <a className="btn dark sm" href={bubble.button.href} target="_blank" rel="noopener noreferrer" onClick={onDismiss}>{bubble.button.label}</a>}
          {bubble.button?.copy && <button className="btn dark sm" type="button" onClick={() => { navigator.clipboard?.writeText(bubble.button.copy).catch(() => {}); onDismiss(); }}>{bubble.button.label}</button>}
          <button className="bot-x" type="button" aria-label="Dismiss" onClick={onDismiss}>✕</button>
        </div>
      )}
      <button type="button" className="bot-btn" id="pipBtn" aria-expanded={open} aria-controls="chat" aria-label="Chat with Pip" onClick={onToggle}>
        <span className="bot-avatar"><PipAvatar size={BOT_SIZE} status={status} theme={theme} moves /></span>
        <span className="bot-tag" aria-hidden="true">Ask Pip</span>
      </button>
    </div>
  );
}
