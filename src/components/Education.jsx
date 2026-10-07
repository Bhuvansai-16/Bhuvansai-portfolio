import { useRef } from 'react';
import { ScrollTrigger, motion, useGsap } from '../lib/motion';
import { EDUCATION } from '../content';
import { SplitWords } from './ui';

export default function Education() {
  const ref = useRef(null);

  // each check draws its circle then its tick, 150ms apart
  useGsap(ref, () => {
    if (!motion) return;
    ScrollTrigger.batch(ref.current.querySelectorAll('.checks li'), { start: 'top bottom', once: true, onEnter: els => els.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 150)) });
  }, []);

  return (
    <section className="edu screen" id="education" data-section="verifier" aria-labelledby="h-edu" ref={ref}>
      <div className="fit">
      <SplitWords className="h-big" id="h-edu" text="Checks passed" />
      <ul className="checks">
        {EDUCATION.map(({ title, detail, url }) => (
          <li key={title} className={motion ? undefined : 'in'}>
            <svg className="ck" width="44" height="44" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" /><path d="m13 23 6 6 12-13" /></svg>
            {url ? (
              <a className="check-link" href={url} target="_blank" rel="noopener noreferrer">
                <h3>{title}</h3><p className="muted">{detail}</p><span className="check-cta">View certificate →</span>
              </a>
            ) : <div><h3>{title}</h3><p className="muted">{detail}</p></div>}
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
