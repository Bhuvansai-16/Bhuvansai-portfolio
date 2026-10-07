import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion } from '../lib/motion';

// Pip's look, in one place. Load the avatar during idle time without showing a loading placeholder.
const BotAvatar = lazy(() => import('bot-avatars').then(m => ({ default: m.BotAvatar })));
const DARK = new Set(['midnight', 'grape']);

// Idle moves for the corner Pip. Jumps set the library's jump numbers, then fire its own click hop;
// the rest are CSS on a wrapper, so they stack with the canvas animation.
const JUMPS = {
  spin: { jumpSpin: 1 },
  flip: { jumpSpin: 2, jumpHeight: 38, jumpTime: 0.9, whirl: 1 },
  bounce: { jumpSpin: 0, jumpHeight: 18, jumpSquashEase: 'bouncy' },
};
const MOVES = [...Object.keys(JUMPS), 'wiggle', 'peek', 'tilt'];
const SLEEP_AFTER = 45_000; // no pointer, key, scroll or touch for this long and Pip dozes off

// shading="plastic" is the chosen look; it costs ~4.5 ms per frame (smooth ~0.35 ms) plus a ~130 ms first draw.
// jumpEvery: seconds between the library's own idle hop-and-spin (default 8); 0 turns it off.
// moves: a different idle move every few seconds, and a nap when the visitor goes quiet.
export default function PipAvatar({ size, status = 'idle', theme, jumpEvery, moves = false }) {
  const [avatarReady, setAvatarReady] = useState(false);
  const [move, setMove] = useState(null); // { name, n }: n changes every time, so a repeat still fires
  const [asleep, setAsleep] = useState(false);
  const canvas = useRef(null), sleepy = useRef(false);
  const thinking = status === 'thinking';
  const motionClass = thinking ? 'thinking' : status === 'acting' ? 'acting' : 'idle';
  const playing = moves && motion && status === 'idle';
  const play = name => setMove(m => ({ name, n: (m?.n ?? 0) + 1 }));

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setAvatarReady(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(() => setAvatarReady(true), 350);
    return () => clearTimeout(id);
  }, []);

  // a new move every 6-11 s, never the same one twice in a row
  useEffect(() => {
    if (!playing || asleep) return;
    let t;
    const next = () => (t = setTimeout(() => {
      if (!document.hidden) setMove(m => {
        const pool = MOVES.filter(x => x !== m?.name);
        return { name: pool[Math.floor(Math.random() * pool.length)], n: (m?.n ?? 0) + 1 };
      });
      next();
    }, 6000 + Math.random() * 5000));
    next();
    return () => clearTimeout(t);
  }, [playing, asleep]);

  // doze off when the visitor goes quiet; wake with a startled spin
  useEffect(() => {
    if (!playing) return;
    let t, last = 0;
    const nap = () => (t = setTimeout(() => { sleepy.current = true; setAsleep(true); }, SLEEP_AFTER));
    const active = () => {
      if (Date.now() - last < 1000) return;
      last = Date.now();
      clearTimeout(t);
      if (sleepy.current) { sleepy.current = false; setAsleep(false); play('spin'); }
      nap();
    };
    const evs = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach(e => window.addEventListener(e, active, { passive: true }));
    nap();
    return () => {
      clearTimeout(t);
      evs.forEach(e => window.removeEventListener(e, active));
      sleepy.current = false;
      setAsleep(false);
    };
  }, [playing]);

  // The avatar has taken this move's jump numbers by now (a child's effects run before its parent's), so fire
  // its click hop. That click is untrusted, and the wrapper stops it before it reaches a button around Pip.
  useEffect(() => {
    if (move && JUMPS[move.name]) canvas.current?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, [move]);

  const jump = moves ? JUMPS[move?.name] || JUMPS.spin : null;
  return (
    <span className={`pip-avatar pip-avatar-${motionClass}`} style={{ width: size, height: size }}>
      <span className={`pip-move${move && !JUMPS[move.name] ? ` pip-move-${move.name}` : ''}`} onClick={e => e.nativeEvent.isTrusted || e.stopPropagation()}>
        {avatarReady && (
          <Suspense fallback={null}>
            <BotAvatar ref={canvas} type="clover" face={thinking ? 'eyes' : 'mouth'} size={size} shading="plastic"
              jumpEvery={moves ? 0 : jumpEvery} {...jump} turn={1.25}
              state={status === 'acting' ? 'working' : asleep ? 'sleeping' : 'default'} theme={DARK.has(theme) ? 'dark' : 'light'} aria-hidden="true" />
          </Suspense>
        )}
      </span>
      {thinking && <span className="pip-thought" aria-hidden="true"><i /><i /><i /></span>}
      {asleep && <span className="pip-zzz" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span>}
    </span>
  );
}
