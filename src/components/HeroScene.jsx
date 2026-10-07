import { useRef } from 'react';
import { gsap, motion, fine, useGsap } from '../lib/motion';

// Dusk valley behind the hero: stacked SVG layers (sky, clouds, far mountain, mist, hills, meadow).
// Each layer is its own element so parallax moves composited layers, not one big repainting SVG.
// Colours come from CSS variables, so every theme gets its own sky.
const VB = '0 0 1600 900';
const stop = (offset, v, o = 1) => <stop offset={offset} style={{ stopColor: `var(${v})`, stopOpacity: o }} />;
const STARS = [[90, 60, 1.6], [210, 140, 1.1], [330, 48, 1.4], [470, 120, 1], [560, 34, 1.8], [690, 96, 1.2], [760, 190, 1], [905, 52, 1.5], [1010, 150, 1.1], [1120, 70, 1.7], [1240, 132, 1], [1330, 42, 1.3], [1450, 110, 1.6], [1540, 58, 1.1], [150, 250, 1], [400, 230, 1.2], [1180, 240, 1.1], [1500, 220, 1]];
const TREES = [[1180, 800], [1215, 786], [1252, 768], [1290, 752], [1330, 736], [1372, 722], [1412, 706], [1452, 694], [1492, 684], [1532, 676], [1268, 792], [1352, 770], [1432, 744], [1508, 718], [1572, 690], [70, 642], [118, 658], [36, 668], [176, 684], [228, 704]];

function Layer({ depth, children }) {
  return (
    <div className="hs-layer" data-depth={depth}>
      <svg viewBox={VB} preserveAspectRatio="xMidYMax slice">{children}</svg>
    </div>
  );
}

export default function HeroScene() {
  const ref = useRef(null);

  useGsap(ref, () => {
    if (!motion) return;
    const layers = gsap.utils.toArray('.hs-layer', ref.current), hero = ref.current.parentElement;
    gsap.from(layers.slice(2), { yPercent: 8, duration: 1.6, stagger: 0.06, ease: 'expo.out' }); // hills rise in
    gsap.to('.hs-drift', { x: 70, duration: 22, yoyo: true, repeat: -1, ease: 'sine.inOut', scrollTrigger: { trigger: hero, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' } }); // clouds drift only while the hero is nearby
    // depth on scroll: far layers lag behind the page, the meadow moves with it
    layers.forEach(l => gsap.to(l, { y: (1 - l.dataset.depth) * 160, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } }));
    if (!fine) return;
    // depth on mouse: near layers shift more than far ones
    const movers = layers.map(l => ({ d: +l.dataset.depth, x: gsap.quickTo(l.firstChild, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(l.firstChild, 'y', { duration: 1.2, ease: 'power3' }) }));
    const move = e => { const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5; movers.forEach(m => { m.x(mx * m.d * -28); m.y(my * m.d * -12); }); };
    hero.addEventListener('mousemove', move);
    return () => hero.removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="hero-scene" ref={ref} aria-hidden="true">
      <Layer depth={0}>
        <defs><linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">{stop(0, '--sky1')}{stop(0.55, '--sky2')}{stop(0.82, '--sky3')}</linearGradient></defs>
        <rect width="1600" height="900" fill="url(#hs-sky)" />
        <g className="hs-stars">{STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} style={{ animationDelay: `${(i % 6) * 0.6}s` }} />)}</g>
      </Layer>
      <Layer depth={0.12}>
        <defs><radialGradient id="hs-cloud">{stop(0, '--cloud', 0.85)}{stop(0.6, '--cloud', 0.35)}{stop(1, '--cloud', 0)}</radialGradient></defs>
        <g className="hs-drift" fill="url(#hs-cloud)">
          <ellipse cx="260" cy="500" rx="300" ry="60" /><ellipse cx="1300" cy="470" rx="340" ry="70" />
          <ellipse cx="820" cy="565" rx="440" ry="62" /><ellipse cx="1180" cy="300" rx="200" ry="34" /><ellipse cx="420" cy="330" rx="170" ry="28" />
        </g>
      </Layer>
      <Layer depth={0.25}>
        <defs><linearGradient id="hs-far" x1="0" y1="0" x2="0" y2="1">{stop(0, '--far1')}{stop(1, '--far2')}</linearGradient></defs>
        <path fill="url(#hs-far)" d="M300 920L300 720C430 660 540 615 640 592C705 577 745 552 795 548C845 544 885 560 930 576C1000 600 1090 640 1180 676C1230 696 1270 712 1310 720L1310 920Z" />
        <path className="hs-ridge" d="M640 592C705 577 745 552 795 548C845 544 885 560 930 576" />
      </Layer>
      <Layer depth={0.3}>
        <defs>
          <linearGradient id="hs-mist" x1="0" y1="0" x2="0" y2="1">{stop(0, '--mist', 0)}{stop(0.5, '--mist', 0.32)}{stop(1, '--mist', 0)}</linearGradient>
          <radialGradient id="hs-glow">{stop(0, '--mist', 0.28)}{stop(1, '--mist', 0)}</radialGradient>
        </defs>
        <rect y="600" width="1600" height="170" fill="url(#hs-mist)" />
        <ellipse cx="800" cy="690" rx="520" ry="80" fill="url(#hs-glow)" />
      </Layer>
      <Layer depth={0.5}>
        <defs><linearGradient id="hs-mid" x1="0" y1="0" x2="0" y2="1">{stop(0, '--mid1')}{stop(1, '--mid2')}</linearGradient></defs>
        <path fill="url(#hs-mid)" d="M-20 420C120 440 240 492 340 552C440 612 540 676 640 735C690 765 720 790 740 822L740 920L-20 920Z" />
        <path fill="url(#hs-mid)" d="M1620 470C1490 482 1380 520 1285 572C1185 628 1100 688 1000 742C950 770 920 795 900 822L900 920L1620 920Z" />
      </Layer>
      <Layer depth={0.75}>
        <defs><linearGradient id="hs-near" x1="0" y1="0" x2="0" y2="1">{stop(0, '--near1')}{stop(1, '--near2')}</linearGradient></defs>
        <path fill="url(#hs-near)" d="M-20 600C140 630 280 690 400 748C470 782 530 812 580 840L580 920L-20 920Z" />
        <path fill="url(#hs-near)" d="M1620 640C1470 660 1350 710 1240 768C1180 800 1130 826 1090 846L1090 920L1620 920Z" />
        <g className="hs-trees">{TREES.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={i % 3 ? 8 : 10} ry={i % 3 ? 14 : 17} />)}</g>
      </Layer>
      <Layer depth={1}>
        <defs><linearGradient id="hs-meadow" x1="0" y1="0" x2="0" y2="1">{stop(0, '--meadow1')}{stop(1, '--meadow2')}</linearGradient></defs>
        <path fill="url(#hs-meadow)" d="M-20 836C260 800 560 804 800 818C1040 832 1340 806 1620 822L1620 920L-20 920Z" />
      </Layer>
    </div>
  );
}
