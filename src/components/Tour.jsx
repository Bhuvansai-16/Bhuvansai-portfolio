import { useEffect, useRef, useState } from 'react';
import { gsap, motion, scroller, scrollToEl, ROLE_COLOR } from '../lib/motion';
import { TOUR } from '../content';
import { Icon } from './ui';
import PipAvatar from './PipAvatar';
import { BOT_SIZE } from './Bot';

const AUTO = 5; // seconds per stop before moving on (paused while hovered)
const colorOf = role => (role === 'interrupt' ? 'var(--violet)' : ROLE_COLOR[role]);
// Each stop scrolls its section to the top and Pip parks above the heading, inside the section's top padding.
// Sections whose top padding is shorter than Pip needs (the compact GitHub, Education and Certifications
// sections, or a `target` like the work cards) sit just low enough to make room.
const stopOf = n => {
  const sec = document.getElementById(TOUR[n].id), target = TOUR[n].target && sec?.querySelector(TOUR[n].target);
  return { scrollEl: target || sec, head: target || sec?.querySelector('.h-big, .mega') };
};
const ROOM = BOT_SIZE + 36; // space above a heading for Pip, its gap and its bob, so it never leaves the screen
const dock = (left, top) => ({ x: left + BOT_SIZE / 2, y: top - BOT_SIZE / 2 - 14 }); // parks above the heading, never over content
const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];

// Guided tour: Pip flies ahead of the scroll to each section and talks about the page.
// Scrolling yourself (or Esc) ends it.
export default function Tour({ start, onEnd, theme }) {
  const botRef = useRef(null);
  const [stop, setStop] = useState(-1);
  const [pop, setPop] = useState(null); // bubble position; null while flying
  const [burst, setBurst] = useState(null);
  const goRef = useRef(null), endRef = useRef(null);
  const last = stop === TOUR.length - 1;

  useEffect(() => {
    if (!start) return;
    const bot = botRef.current;
    let live = true, busy = false, tweens = [];
    const track = t => (tweens.push(t), t);
    const killAll = () => { tweens.forEach(t => t.kill()); tweens = []; };

    // Glide on a low arc to the next section. Pip stays upright: it only leans a little toward
    // where it's going and settles straight as it lands (a round bot spinning along the path looks broken).
    const flyTo = (to, dur = 1.6) => new Promise(res => {
      const from = { x: gsap.getProperty(bot, 'x'), y: gsap.getProperty(bot, 'y') };
      if (!motion) { gsap.set(bot, { x: to.x, y: to.y, rotation: 0 }); return res(); }
      const c = { x: (from.x + to.x) / 2, y: Math.max(40, Math.min(from.y, to.y) - 30) }, o = { t: 0 };
      const lean = Math.max(-8, Math.min(8, (to.x - from.x) / 40));
      track(gsap.to(o, {
        t: 1, duration: dur, ease: 'sine.inOut', onComplete: res,
        onUpdate: () => {
          const t = o.t, u = 1 - t;
          gsap.set(bot, {
            x: u * u * from.x + 2 * u * t * c.x + t * t * to.x,
            y: u * u * from.y + 2 * u * t * c.y + t * t * to.y,
            rotation: lean * Math.sin(Math.PI * t),
          });
        },
      }));
    });

    // The bob runs on yPercent, separate from the flight's x/y, so it keeps floating between stops.
    let bob = null;
    const stopBob = () => { bob?.kill(); bob = null; };

    // Tour over: Pip hops and vanishes in a puff.
    const finish = () => {
      if (!live) return;
      live = false;
      scroller.touring = false;
      killAll();
      stopBob();
      setPop(null);
      setBurst({ x: gsap.getProperty(bot, 'x'), y: gsap.getProperty(bot, 'y'), k: Date.now() });
      gsap.timeline({ onComplete: () => { setStop(-1); onEnd(); } })
        .to(bot, { yPercent: -80, scale: 1.2, rotation: 0, duration: motion ? 0.35 : 0, ease: 'power2.out' })
        .to(bot, { scale: 0, opacity: 0, duration: motion ? 0.25 : 0, ease: 'power2.in' });
    };

    const go = async n => {
      if (!live || busy) return;
      const st = n < TOUR.length && stopOf(n);
      if (!st?.head) return finish();
      busy = true;
      killAll();
      setPop(null);
      setStop(n);
      const h = st.head, rel = h.getBoundingClientRect().top - st.scrollEl.getBoundingClientRect().top; // head's place once scrolled flush
      const offset = Math.min(0, rel - ROOM); // too little room above the heading: stop the section a bit lower
      await Promise.all([flyTo(dock(h.getBoundingClientRect().left, rel - offset)), scrollToEl(st.scrollEl, offset)]);
      if (!live) return;
      const f = h.getBoundingClientRect(), d = dock(f.left, f.top);
      track(gsap.to(bot, { x: d.x, y: d.y, rotation: 0, duration: motion ? 0.45 : 0, ease: 'sine.out' }));
      if (motion && !bob) bob = gsap.to(bot, { yPercent: -62, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.45 });
      setPop({ x: d.x + BOT_SIZE / 2 + 10, y: d.y });
      document.getElementById('announce').textContent = `Tour stop ${n + 1} of ${TOUR.length}: ${TOUR[n].text}`;
      busy = false;
    };
    goRef.current = go;
    endRef.current = finish;

    // your own scrolling takes back control
    const onUser = e => {
      if (e.type === 'keydown') {
        if (e.key === 'Escape') return finish();
        if (!SCROLL_KEYS.includes(e.key) || e.target.closest?.('button, input, textarea')) return;
      }
      finish();
    };
    addEventListener('wheel', onUser, { passive: true });
    addEventListener('touchmove', onUser, { passive: true });
    addEventListener('keydown', onUser);

    // Pop out of the floating Pip button, climb a little, then head to the first stop.
    scroller.touring = true;
    setBurst({ x: start.x, y: start.y, k: start.id });
    gsap.set(bot, { x: start.x, y: start.y, xPercent: -50, yPercent: -50, rotation: 0, scale: 0, opacity: 1 });
    track(gsap.to(bot, { scale: 1, y: start.y - 60, duration: motion ? 0.7 : 0, ease: 'expo.out', onComplete: () => go(0) }));

    return () => {
      live = false;
      scroller.touring = false;
      killAll();
      stopBob();
      removeEventListener('wheel', onUser);
      removeEventListener('touchmove', onUser);
      removeEventListener('keydown', onUser);
    };
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = stop >= 0 ? TOUR[stop] : null;
  return (
    <>
      {burst && <span className="tour-burst" key={burst.k} style={{ left: burst.x, top: burst.y }} onAnimationEnd={() => setBurst(null)} aria-hidden="true" />}
      <div className="tour-bot" ref={botRef} aria-hidden="true">{start && <PipAvatar size={BOT_SIZE} theme={theme} jumpEvery={0} />}</div>
      {s && pop && (
        <div className="tour-pop" key={stop} role="dialog" aria-label={s.text}
          style={{ left: pop.x, top: pop.y, maxWidth: Math.min(640, innerWidth - pop.x - 12), '--c': colorOf(s.role) }}>
          <p className="tour-text">{s.text}</p>
          <span className="tour-ctrl">
            {!last && <button type="button" aria-label="Next stop" onClick={() => goRef.current?.(stop + 1)}><Icon id="arrow" size={14} /></button>}
            <button type="button" aria-label="End tour" onClick={() => endRef.current?.()}>✕</button>
          </span>
          {motion && (
            <span className="tour-bar" style={{ animationDuration: `${last ? 3.5 : AUTO}s` }}
              onAnimationEnd={() => (last ? endRef.current?.() : goRef.current?.(stop + 1))} />
          )}
        </div>
      )}
    </>
  );
}
