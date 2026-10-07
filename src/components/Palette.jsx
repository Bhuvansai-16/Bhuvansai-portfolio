import { useEffect, useRef, useState } from 'react';

// Ctrl/Cmd+K command menu: jump to sections, switch theme, download resume, copy email.
export default function Palette({ open, setOpen, commands }) {
  const dlg = useRef(null), input = useRef(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const shown = commands.filter(c => c.n.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const d = dlg.current;
    if (open && !d.open) { setQ(''); setSel(0); d.showModal(); input.current.focus(); }
    else if (!open && d.open) d.close();
  }, [open]);

  const run = i => { const c = shown[i]; if (!c) return; setOpen(false); c.f(); };
  const onKey = e => {
    if (!shown.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => (s + 1) % shown.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => (s - 1 + shown.length) % shown.length); }
    else if (e.key === 'Enter') run(sel);
  };

  return (
    <dialog className="palette" id="palette" aria-label="Command menu" ref={dlg} onClose={() => setOpen(false)} onClick={e => e.target === dlg.current && setOpen(false)}>
      <input placeholder="Jump to a section or run a command" aria-label="Command" autoComplete="off" ref={input} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
      <ul role="listbox" data-lenis-prevent>
        {shown.length ? shown.map((c, i) => <li key={c.n} role="option" aria-selected={i === sel} onClick={() => run(i)}>{c.n}</li>) : <li>No match</li>}
      </ul>
    </dialog>
  );
}
