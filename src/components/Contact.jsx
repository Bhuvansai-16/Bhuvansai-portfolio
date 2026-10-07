import { useEffect, useRef, useState } from 'react';
import { gsap, motion, rand, useGsap, fly, goTo } from '../lib/motion';
import { CONTACT, PROFILE } from '../content';
import { sendContactMessage } from '../lib/contact';
import { Icon, SplitWords } from './ui';

const WM_C = ['var(--lime)', 'var(--orange)', 'var(--pink)', 'var(--sky)'];

export default function Contact({ onAsk }) {
  const ref = useRef(null), footRef = useRef(null);
  const [drift] = useState(() => Array.from({ length: 9 }, () => ({ s: Math.round(rand(16, 34)), l: rand(4, 94), t: rand(6, 92), r: rand(-40, 40) })));
  const [err, setErr] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState({ text: '', error: false });
  const [copied, setCopied] = useState(false);

  useGsap(ref, () => {
    if (!motion) return;
    gsap.utils.toArray('.drift svg', ref.current).forEach(el => gsap.to(el, { x: rand(-140, 140), y: rand(-90, 90), rotation: `+=${rand(-30, 30)}`, duration: rand(6, 11), yoyo: true, repeat: -1, ease: 'sine.inOut', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' } }));
    const wm = footRef.current.querySelector('.wordmark');
    gsap.from(wm.children, { yPercent: 105, duration: 1.3, stagger: 0.045, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: wm, start: 'top bottom', once: true } });
  }, []);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => {
      ref.current?.querySelector('form')?.reset();
      setErr({});
      setNote({ text: '', error: false });
      setSent(false);
    }, 4200);
    return () => clearTimeout(timer);
  }, [sent]);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget, v = Object.fromEntries(new FormData(form));
    const next = {
      name: v.name.trim() ? '' : 'Enter your name.',
      email: /^\S+@\S+\.\S+$/.test(v.email) ? '' : 'Enter a valid email address.',
      message: v.message.trim().length >= 10 ? '' : 'Write at least a sentence (10 characters).',
    };
    setErr(next);
    const bad = ['name', 'email', 'message'].find(k => next[k]);
    if (bad) { form.elements[bad].focus(); return; }
    setSending(true); setNote({ text: '', error: false });
    try {
      if (PROFILE.formEndpoint) {
        await sendContactMessage(v);
      } else {
        location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent('Portfolio message from ' + v.name)}&body=${encodeURIComponent(v.message + '\n\n' + v.email)}`;
      }
      setSent(true);
      setNote({ text: 'Thanks — your message is on its way!', error: false });
    } catch {
      setNote({ text: `Message didn't send. Check your connection and try again, or email ${PROFILE.email}.`, error: true });
    } finally {
      setSending(false);
    }
  }

  async function copyEmail() {
    try { await navigator.clipboard.writeText(PROFILE.email); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  }

  const field = (id, name, label, input) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {input({ id, name, 'aria-describedby': `e-${name}`, 'aria-invalid': !!err[name] })}
      <p className="err" id={`e-${name}`}>{err[name]}</p>
    </div>
  );

  return (
    <>
    <section className="contact screen" id="contact" data-section="interrupt" aria-labelledby="h-contact" ref={ref}>
      <div className="drift" aria-hidden="true">
        {drift.map((p, i) => (
          <svg key={i} width={p.s} height={p.s} style={{ left: `${p.l}%`, top: `${p.t}%`, transform: `rotate(${p.r}deg)` }}><use href="#plane" /></svg>
        ))}
      </div>
      <div className="ct-inner fit">
        <SplitWords className="mega" id="h-contact" text={CONTACT.heading} />
        <p className="ct-sub">{CONTACT.invite}</p>
        <div className="ct-grid">
          <form onSubmit={submit} noValidate>
            {field('cName', 'name', 'Name', p => <input {...p} autoComplete="name" />)}
            {field('cEmail', 'email', 'Email', p => <input {...p} type="email" autoComplete="email" />)}
            {field('cMsg', 'message', 'Message', p => <textarea {...p} rows="4" />)}
            <div className="ct-form-actions">
              <button className="btn light" type="submit" data-magnet disabled={sending || sent}>
                {sending ? 'Sending… ' : sent ? 'Sent ' : 'Send message '}<Icon id="arrow" />
              </button>
              <button className="btn contact-secondary" type="button" onClick={onAsk}>Ask my agent <Icon id="plane" /></button>
            </div>
            <p className={`form-status${note.error ? ' error' : ''}${sent ? ' success' : ''}`} role="status" aria-live="polite">
              {sent && <span className="form-success-mark" aria-hidden="true"><Icon id="check" size={14} /></span>}
              <span>{note.text}</span>
            </p>
          </form>
          <ul className="ct-links">
            <li><span className="mono">Email</span><a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a><button type="button" className="copy" onClick={copyEmail}>{copied ? 'Copied' : 'Copy'}</button></li>
            <li><span className="mono">LinkedIn</span><a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">linkedin.com/in/bhuvansaich</a></li>
            <li><span className="mono">GitHub</span><a href={`https://github.com/${PROFILE.github}`} rel="noopener">github.com/{PROFILE.github}</a></li>
            <li><span className="mono">Resume</span><a href={PROFILE.resume} target="_blank" rel="noopener">View</a></li>
          </ul>
        </div>
      </div>
    </section>
    {/* the page footer continues the dark contact block, outside the full-screen section */}
    <footer className="site-foot" ref={footRef}>
      <div className="foot">
        <span>© 2026 {PROFILE.name}</span>
        <button type="button" className="to-top" onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          fly({ x: r.left + r.width / 2, y: r.top }, document.querySelector('.logo-mark'), 'var(--lime)');
          goTo('#top');
        }}>Back to top <Icon id="arrow" style={{ rotate: '-90deg' }} /></button>
      </div>
      <p className="wordmark" aria-hidden="true">
        {[...PROFILE.name].map((ch, i) => <span key={i} style={{ '--h': WM_C[i % 4] }}>{ch}</span>)}
      </p>
    </footer>
    </>
  );
}
