import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, motion, useGsap } from '../lib/motion';
import { HERO } from '../content';
import { Icon, SplitWords } from './ui';
import HeroScene from './HeroScene';

export default function Hero({ onAsk, onTour }) {
  const ref = useRef(null);
  const flowRef = useRef(null);
  const youRef = useRef(null);
  const btnRef = useRef(null);
  const [arrow, setArrow] = useState(null);

  // headline rises in word by word; the text eases away as you scroll past
  useGsap(ref, () => {
    if (!motion) return;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.display .word>span', { yPercent: 115, duration: 1.2, stagger: 0.05 })
      .from('.hero-flow', { y: 24, opacity: 0, duration: 1 }, 0.45);
    gsap.to('.hero-copy', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } });
  }, []);

  useLayoutEffect(() => {
    let animId;
    const update = () => {
      if (!flowRef.current || !youRef.current || !btnRef.current) return;
      const rFlow = flowRef.current.getBoundingClientRect();
      const rYou = youRef.current.getBoundingClientRect();
      const rBtn = btnRef.current.getBoundingClientRect();

      if (rFlow.width === 0 || rYou.width === 0 || rBtn.width === 0) return;

      // One smooth S, a single cubic so it cannot kink: leaves "you" straight down, sweeps left, drops straight into the button.
      // Rects are on screen; the svg draws in the hero's own (possibly zoomed) pixels.
      const z = flowRef.current.currentCSSZoom || 1;
      const sx = ((rYou.left + rYou.right) / 2 - rFlow.left) / z;
      const sy = (rYou.bottom - rFlow.top) / z + 4;
      const ex = ((rBtn.left + rBtn.right) / 2 - rFlow.left) / z;
      const ey = (rBtn.top - rFlow.top) / z - 10;
      const h = (ey - sy) * 0.68; // handle length: longer = tighter bends at both ends
      const line = `M ${sx} ${sy} C ${sx} ${sy + h}, ${ex} ${ey - h}, ${ex} ${ey - 9}`;
      const head = `M ${ex - 6.5} ${ey - 9} L ${ex} ${ey} L ${ex + 6.5} ${ey - 9}`;

      setArrow({ line, head });
    };

    update();
    animId = requestAnimationFrame(update);
    const timer = setTimeout(update, 120);
    addEventListener('resize', update);
    ScrollTrigger.addEventListener('refresh', update); // after App re-fits the page scale
    document.fonts?.ready.then(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer);
      removeEventListener('resize', update);
      ScrollTrigger.removeEventListener('refresh', update);
    };
  }, []);

  return (
    <section className="hero" id="top" data-section="planner" aria-labelledby="h-hero" ref={ref}>
      <HeroScene />
      <div className="hero-copy">
        <SplitWords as="h1" className="display" id="h-hero" text={HERO.title} />
        <div className="hero-flow" ref={flowRef}>
          <p className="hero-sub">
            Let my agent show <span className="hero-you" ref={youRef}>you</span> around
          </p>
          {arrow && (
            <svg className="hero-cue-svg" aria-hidden="true">
              <path
                d={arrow.line}
                className="cue-line"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={arrow.head}
                className="cue-head"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="miter"
                strokeMiterlimit="10"
                fill="none"
              />
            </svg>
          )}
          <div className="hero-cta">
            <a className="btn dark" href="#about" ref={btnRef} data-magnet onClick={e => { e.preventDefault(); onTour(e.currentTarget); }}>Start the run <Icon id="arrow" /></a>
            <button className="btn ghost" type="button" id="heroChat" data-magnet onClick={onAsk}>Ask my agent</button>
          </div>
        </div>
      </div>
    </section>
  );
}
