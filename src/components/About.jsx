import { Fragment, useEffect, useRef, useState } from 'react';
import { gsap, motion, fine, useGsap, asset } from '../lib/motion';
import { ABOUT, PROFILE } from '../content';
import { Icon, SplitWords } from './ui';

const RING = 'M14 350a226 64 0 1 0 452 0a226 64 0 1 0-452 0';

// Half of the orbit ring (clipped), so planes pass behind the photo on top and in front below.
const Orbit = ({ clip }) => (
  <g transform="rotate(-10 240 350)">
    <g className="ring" clipPath={`url(#${clip})`}>
      <path className="ring-line" d={RING} />
      {motion && (
        <>
          <g style={{ color: 'var(--violet)' }}><use href="#plane" x="-13" y="-13" width="26" height="26" /><animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path={RING} /></g>
          <g style={{ color: 'var(--orange)' }}><use href="#plane" x="-10" y="-10" width="20" height="20" /><animateMotion dur="9s" begin="-4.5s" repeatCount="indefinite" rotate="auto" path={RING} /></g>
        </>
      )}
    </g>
  </g>
);

export default function About() {
  const ref = useRef(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    const portrait = ref.current?.querySelector('#portrait');
    if (!portrait) return;
    if (!('IntersectionObserver' in window)) { setPhotoReady(true); return; }
    const svg = portrait.querySelector('svg');
    let photoRequested = false;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.some(entry => entry.isIntersecting);
      portrait.classList.toggle('in-view', visible);
      if (visible) {
        svg?.unpauseAnimations();
        if (!photoRequested) { photoRequested = true; setPhotoReady(true); }
      } else svg?.pauseAnimations();
    }, { rootMargin: '300px' });
    observer.observe(portrait);
    return () => observer.disconnect();
  }, []);

  useGsap(ref, () => {
    if (!motion) return;
    const root = ref.current, statement = root.querySelector('.statement'), portrait = root.querySelector('#portrait');
    gsap.fromTo(statement.querySelectorAll('.w'), { opacity: 0.15 }, { opacity: 1, stagger: 0.025, ease: 'none', scrollTrigger: { trigger: statement, start: 'top 90%', end: 'top 50%', scrub: true } });
    gsap.timeline({ scrollTrigger: { trigger: portrait, start: 'top 80%', once: true }, defaults: { ease: 'expo.out' } })
      .from('#pClipRect', { attr: { y: 490, height: 0 }, duration: 1.4, ease: 'expo.inOut' })
      .from('#pInner', { scale: 1.3, svgOrigin: '240 265', duration: 1.8 }, 0.2)
      .from('.ring', { opacity: 0, duration: 1 }, 0.7)
      .from('.sticker', { scale: 0.4, opacity: 0, duration: 1, stagger: 0.12 }, 0.9);
    root.querySelectorAll('.sticker').forEach((s, i) =>
      gsap.to(s, { y: i % 2 ? 40 : -50, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } }));
    if (!fine) return;
    gsap.set(portrait, { transformPerspective: 900 });
    const ry = gsap.quickTo(portrait, 'rotationY', { duration: 0.8, ease: 'power3' }), rx = gsap.quickTo(portrait, 'rotationX', { duration: 0.8, ease: 'power3' });
    const move = e => { const r = portrait.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(((e.clientY - r.top) / r.height - 0.5) * -12); };
    const leave = () => { ry(0); rx(0); };
    portrait.addEventListener('mousemove', move);
    portrait.addEventListener('mouseleave', leave);
    return () => { portrait.removeEventListener('mousemove', move); portrait.removeEventListener('mouseleave', leave); };
  }, []);

  return (
    <section className="about screen" id="about" data-section="retriever" aria-labelledby="h-about" ref={ref}>
      <div className="fit">
      {/* No right-click "save image" or drag-out on the photo. A browser can always keep what it displays,
          so only the small web copy (PP.webp) is deployed; the original stays out of public/. */}
      <figure className="portrait" id="portrait" onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()}>
        <svg className="portrait-svg" viewBox="0 0 480 530" role="img" aria-labelledby="portraitTitle">
          <title id="portraitTitle">Portrait of {PROFILE.name}</title>
          <defs>
            <clipPath id="pClip"><rect id="pClipRect" x="60" y="40" width="360" height="450" rx="34" /></clipPath>
            <clipPath id="ringBack"><rect x="-60" y="-60" width="600" height="410" /></clipPath>
            <clipPath id="ringFront"><rect x="-60" y="350" width="600" height="300" /></clipPath>
          </defs>
          <Orbit clip="ringBack" />
          <g clipPath="url(#pClip)">
            <g id="pInner">
              <rect className="ph-bg" x="60" y="40" width="360" height="450" />
              <circle className="ph-fig" cx="240" cy="212" r="70" />
              <path className="ph-fig" d="M100 520c0-112 62-188 140-188s140 76 140 188z" />
          {photoReady && photoOk && <image href={asset(PROFILE.photo)} x="60" y="40" width="360" height="450" preserveAspectRatio="xMidYMid slice" decoding="async" fetchPriority="low" onError={() => setPhotoOk(false)} />}
            </g>
          </g>
          <Orbit clip="ringFront" />
        </svg>
        <span className="sticker s1"><i className="pdot" />{ABOUT.stickers.status}</span>
        <span className="sticker s4">Freelancer</span>
        <span className="sticker s2"><Icon id="pin" size={15} />{ABOUT.stickers.city}</span>
        <span className="sticker s3">{ABOUT.stickers.fun}</span>
        <span className="tool-float tool-claude" role="img" aria-label="Claude Code">
          <img src={asset('Claude_Icon.png')} alt="" />
        </span>
        <span className="tool-float tool-codex" role="img" aria-label="Codex">
          <img src={asset('codex_icon.jpg')} alt="" />
        </span>
      </figure>

      <div className="about-copy">
        <SplitWords className="h-big" id="h-about" text={ABOUT.heading} />
        <p className="statement" id="statement">
          {ABOUT.statement.split(/\s+/).map((w, i) => <Fragment key={i}>{i > 0 && ' '}<span className="w">{w}</span></Fragment>)}
        </p>
        <dl className="facts">
          {ABOUT.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
      </div>
    </section>
  );
}
