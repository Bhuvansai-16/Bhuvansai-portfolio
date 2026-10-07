import { useRef } from 'react';
import { gsap, ScrollTrigger, motion, useGsap } from '../lib/motion';
import { CERTS } from '../content';
import { Icon, SplitWords } from './ui';

const CLOUD = 'M14 35H34A7.5 7.5 0 0 0 34 20 10 10 0 0 0 14.6 20.5 7.3 7.3 0 0 0 14 35Z';
// Hand-drawn brand marks (48x48), so no external images are needed.
const LOGOS = {
  gdev: <g fill="none" strokeWidth="6.5" strokeLinecap="round"><path d="M20.5 16.5 9.5 24" stroke="#EA4335" /><path d="m9.5 24 11 7.5" stroke="#4285F4" /><path d="m27.5 16.5 11 7.5" stroke="#34A853" /><path d="m38.5 24-11 7.5" stroke="#FBBC04" /></g>,
  kaggle: <g fill="none" stroke="#20BEFF" strokeWidth="3.6"><path d="M17.5 9v30" /><path d="M31.5 18.5 18.5 30.5" /><path d="m24 25.4 9 13.6" /></g>,
  coursera: <><rect x="2" y="2" width="44" height="44" rx="6" fill="#0056D2" /><text x="24" y="27.6" textAnchor="middle" fill="#fff" fontFamily="Geist, system-ui, sans-serif" fontSize="9.4" fontWeight="600" letterSpacing="-.2">coursera</text></>,
  microsoft: <><path fill="#F25022" d="M6 6h17v17H6z" /><path fill="#7FBA00" d="M25 6h17v17H25z" /><path fill="#00A4EF" d="M6 25h17v17H6z" /><path fill="#FFB900" d="M25 25h17v17H25z" /></>,
  aws: <><text x="24" y="25" textAnchor="middle" fill="#232F3E" fontFamily="Geist, system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="-.6">aws</text><g fill="none" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 31q14.5 8 29 0" /><path d="m34.6 28.9 4.3 1.8-1.3 4.4" /></g></>,
  gcloud: <g fill="none" strokeWidth="5">{[['#34A853', '22 78', 0], ['#4285F4', '26 74', -22], ['#EA4335', '29 71', -48], ['#FBBC04', '23 77', -77]].map(([c, da, o]) => <path key={c} pathLength="100" stroke={c} strokeDasharray={da} strokeDashoffset={o} d={CLOUD} />)}</g>,
};

export default function Certifications() {
  const ref = useRef(null);

  useGsap(ref, () => {
    if (!motion) return;
    ScrollTrigger.batch(ref.current.querySelectorAll('.badges li'), { start: 'top bottom', once: true, onEnter: els => gsap.from(els, { y: 48, opacity: 0, scale: 0.8, duration: 1, stagger: 0.08, ease: 'expo.out' }) });
    ScrollTrigger.batch(ref.current.querySelectorAll('.b-check'), { start: 'top bottom', once: true, onEnter: els => gsap.from(els, { scale: 0, duration: 0.6, stagger: 0.08, delay: 0.5, ease: 'expo.out' }) });
  }, []);

  return (
    <section className="certs screen" id="certifications" data-section="evals" aria-labelledby="h-certs" ref={ref}>
      <div className="fit">
      <div className="sec-head">
        <SplitWords className="h-big" id="h-certs" text="Certifications and badges" />
        <p className="muted">Each badge opens a learning profile or certificate.</p>
      </div>
      <ul className="badges">
        {CERTS.map(c => (
          <li key={c.icon}>
            <a className="badge" href={c.url} target="_blank" rel="noopener">
              <span className="b-tile">
                <svg viewBox="0 0 48 48" aria-hidden="true">{LOGOS[c.icon]}</svg>
                <span className="b-check"><Icon id="check" size={14} /></span>
              </span>
              <b>{c.name}</b>
              <small>{c.issuer}</small>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
