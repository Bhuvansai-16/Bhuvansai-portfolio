import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer: fine)').matches;
export const motion = !reduce;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const asset = p => import.meta.env.BASE_URL + p;

// GSAP work scoped to a component. Everything it creates is reverted on unmount
// (and between StrictMode's double runs in dev). fn may return its own cleanup.
export function useGsap(scope, fn, deps = []) {
  useLayoutEffect(() => {
    const ctx = gsap.context(fn, scope);
    return () => ctx.revert();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// Every .screen section fits the viewport, whatever the browser zoom: if its .fit content is taller
// than the room left under the tour band, scale it down with CSS zoom (never below 60%: that only
// happens on very short or zoomed-in windows, where each CSS pixel is already physically bigger).
// Phones scroll normally instead, so their text never gets tiny.
export function fitScreens() {
  document.querySelectorAll('.screen > .fit').forEach(fit => {
    fit.style.zoom = '';
    if (innerWidth < 700) return;
    const cs = getComputedStyle(fit.parentElement), room = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (fit.getBoundingClientRect().height <= room) return;
    let lo = 0.6, hi = 1; // text reflows as it shrinks, so search for the largest zoom that fits
    for (let k = 0; k < 6; k++) {
      const z = (lo + hi) / 2;
      fit.style.zoom = z;
      if (fit.getBoundingClientRect().height <= room) lo = z; else hi = z;
    }
    fit.style.zoom = lo;
  });
}

// Colour per agent role (each page section is one role in the run).
export const ROLE_COLOR = { planner: 'var(--violet)', retriever: '#7FB800', tools: 'var(--orange)', memory: '#2FB344', subgraph: 'var(--sky)', verifier: 'var(--pink)', evals: '#FFB900', interrupt: 'var(--lime)' };

// Smooth scroll handle (Lenis), set by App. touring = the guided tour is driving the scroll.
export const scroller = { lenis: null, touring: false };

// Scroll so el (an element, or a page Y position) sits `offset` px from the top; resolves when done (with a safety timeout).
export function scrollToEl(el, offset = 0) {
  return new Promise(resolve => {
    const done = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(done, 2200);
    if (scroller.lenis) scroller.lenis.scrollTo(el, { offset, duration: 1.6, onComplete: done });
    else {
      const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: top + offset, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(done, reduce ? 50 : 900);
    }
  });
}
export function goTo(hash) {
  const el = hash === '#top' ? 0 : document.querySelector(hash);
  if (el === null) return;
  if (scroller.lenis) scroller.lenis.scrollTo(el, { duration: 1.4 });
  else if (el === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

// A paper plane (plus two fading ghosts) flying on an arc from a point to an element.
export function fly(from, to, color = 'var(--violet)') {
  const layer = document.getElementById('fly');
  if (!motion || !layer || !to) return;
  const p0 = from, b = to.getBoundingClientRect();
  const p2 = { x: b.left + 10, y: b.top + 10 };
  const c = { x: (p0.x + p2.x) / 2 + (p0.y - p2.y) * 0.25, y: Math.min(p0.y, p2.y) - 120 };
  [0, 1, 2].forEach(k => {
    const el = document.createElement('div');
    el.className = 'agent-fly';
    el.style.color = color;
    el.innerHTML = '<svg width="28" height="28"><use href="#plane"/></svg>';
    layer.append(el);
    const frames = [];
    for (let s = 0; s <= 32; s++) {
      const t = s / 32, u = 1 - t;
      const x = u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y = u * u * p0.y + 2 * u * t * c.y + t * t * p2.y;
      const dx = 2 * u * (c.x - p0.x) + 2 * t * (p2.x - c.x), dy = 2 * u * (c.y - p0.y) + 2 * t * (p2.y - c.y);
      frames.push({ transform: `translate(${x - 14}px,${y - 14}px) rotate(${Math.atan2(dy, dx)}rad) scale(${0.7 + 0.5 * Math.sin(Math.PI * t)})`, opacity: Math.min(1, t * 8, (1 - t) * 8) * (k ? 0.3 / k : 1) });
    }
    el.animate(frames, { duration: 1100, delay: k * 60, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }).onfinish = () => el.remove();
  });
}
