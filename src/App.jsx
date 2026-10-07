import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, motion, fine, reduce, goTo, scroller, fitScreens } from './lib/motion';
import { PROFILE } from './content';
import { Sprite } from './components/ui';
import Nav from './components/Nav';
import Rail from './components/Rail';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import About from './components/About';
import Work from './components/Work';
import GitHub from './components/GitHub';
import Experience from './components/Experience';
import Education from './components/Education';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Chat from './components/Chat';
import Bot from './components/Bot';
import { runAction } from './lib/actions';
import { pageUi } from './lib/page';
import Palette from './components/Palette';
import Tour from './components/Tour';
import Cursor from './components/Cursor';

const SECTIONS = ['top', 'about', 'work', 'github', 'experience', 'education', 'certifications', 'contact'];
const THEMES = ['daylight', 'midnight', 'citrus', 'grape'];

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'daylight');
  const [chatOpen, setChatOpen] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [active, setActive] = useState('top');
  const [tour, setTour] = useState(null);
  const vtCur = useRef(null);
  const [bubble, setBubble] = useState(null);
  const [agentStatus, setAgentStatus] = useState('idle');

  // The tour avatar takes off from Pip's floating corner button.
  const startTour = useCallback(() => {
    const r = document.querySelector('#pipBtn .bot-avatar')?.getBoundingClientRect();
    setChatOpen(false);
    setTour({ id: Date.now(), x: r ? r.left + r.width / 2 : innerWidth - 48, y: r ? r.top + r.height / 2 : innerHeight - 48 });
  }, []);

  const applyTheme = useCallback(t => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch { /* private mode */ }
    setTheme(t);
  }, []);

  // Theme switch: the new theme wipes in as a circle from the clicked swatch (View Transitions API).
  const pickTheme = useCallback((t, from) => {
    const root = document.documentElement;
    if (t === root.dataset.theme) return;
    if (!document.startViewTransition || reduce) return applyTheme(t);
    const r = from?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theming');
    const vt = (vtCur.current = document.startViewTransition(() => flushSync(() => applyTheme(t))));
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    vt.finished.finally(() => { if (vtCur.current === vt) root.classList.remove('theming'); }); // an older wipe must not end a newer one
  }, [applyTheme]);

  // Pip's page actions: what to do lives in lib/actions, how to do it on this page in lib/page.
  const ui = useMemo(() => pageUi({ setChatOpen, pickTheme, startTour }), [pickTheme, startTour]);
  const onAction = useCallback(async action => {
    const b = await runAction(action, ui);
    if (b) setBubble({ ...b, id: Date.now() });
    return b;
  }, [ui]);
  const dismissBubble = useCallback(() => setBubble(null), []);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sections fit the screen at any browser zoom. ScrollTrigger refreshes on resize/zoom and after
  // content changes (fonts, GitHub data), so re-fit right before it measures.
  useLayoutEffect(() => {
    let t;
    const refit = () => { clearTimeout(t); t = setTimeout(() => { fitScreens(); ScrollTrigger.refresh(); }, 150); };
    fitScreens();
    ScrollTrigger.addEventListener('refreshInit', fitScreens);
    addEventListener('resize', refit); // browser zoom changes fire resize too
    return () => { clearTimeout(t); removeEventListener('resize', refit); ScrollTrigger.removeEventListener('refreshInit', fitScreens); };
  }, []);

  // Smooth scroll
  useEffect(() => {
    if (!motion || !fine) return;
    const lenis = new Lenis({ lerp: 0.085 });
    scroller.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = t => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(raf); lenis.destroy(); scroller.lenis = null; };
  }, []);

  // In-page links scroll smoothly; bare "#" placeholder links stay put.
  useEffect(() => {
    const onClick = e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return; // a component already handled it (e.g. "Start the run")
      e.preventDefault();
      if (a.getAttribute('href').length > 1) goTo(a.getAttribute('href'));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Ctrl/Cmd+K opens the command menu, Esc closes the chat.
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalOpen(o => !o); }
      else if (e.key === 'Escape') setChatOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  // Shared motion: section headings rise in word by word, supporting text slides up, buttons are magnetic.
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!motion) return;
      gsap.utils.toArray('[data-split]:not(#h-hero)').forEach(el =>
        gsap.from(el.querySelectorAll('.word>span'), { yPercent: 115, duration: 1.1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
      gsap.utils.toArray('.facts, .sec-head p, .exp-side p, .ct-sub, .ct-grid').forEach(el =>
        gsap.from(el, { y: 32, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top bottom', once: true } })); // full-screen sections end at the screen's edge, so reveal on entry
      if (!fine) return;
      const off = [...document.querySelectorAll('[data-magnet]')].map(el => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
        const move = e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); };
        const leave = () => { xTo(0); yTo(0); };
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseleave', leave);
        return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
      });
      return () => off.forEach(f => f());
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  const onSection = useCallback(id => {
    setActive(id);
  }, []);

  const commands = [
    { n: 'Take the guided tour', f: () => startTour(null) },
    ...SECTIONS.map(id => ({ n: `Go to ${id === 'top' ? 'start' : id}`, f: () => goTo('#' + id) })),
    ...THEMES.map(t => ({ n: `Theme: ${t}`, f: () => pickTheme(t) })),
    { n: 'View resume', f: () => { const a = document.createElement('a'); a.href = PROFILE.resume; a.target = '_blank'; a.rel = 'noopener'; a.click(); } },
    { n: 'Copy email', f: () => navigator.clipboard?.writeText(PROFILE.email) },
    { n: 'Ask my agent', f: () => setChatOpen(true) },
  ];

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Sprite />
      <Nav active={active} theme={theme} onTheme={pickTheme} onPalette={() => setPalOpen(true)} />
      <Rail onSection={onSection} />
      <main id="main">
        <Hero onAsk={() => setChatOpen(true)} onTour={startTour} />
        <About />
        <Marquee />
        <Work />
        <GitHub />
        <Experience />
        <Education />
        <Certifications />
        <Contact onAsk={() => setChatOpen(true)} />
      </main>
      <Chat open={chatOpen} setOpen={setChatOpen} section={active} theme={theme} onAction={onAction} onSendEmail={ui.sendEmail} onStatus={setAgentStatus} />
      {!tour && <Bot open={chatOpen} onToggle={() => setChatOpen(o => !o)} status={agentStatus} theme={theme} bubble={bubble} onDismiss={dismissBubble} />}
      <Palette open={palOpen} setOpen={setPalOpen} commands={commands} />
      <Tour start={tour} onEnd={() => setTour(null)} theme={theme} />
      <Cursor />
      <div className="sr" id="announce" role="status" aria-live="polite" />
      <div id="fly" aria-hidden="true" />
    </>
  );
}
