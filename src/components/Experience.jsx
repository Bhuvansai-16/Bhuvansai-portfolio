import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, motion, useGsap } from '../lib/motion';
import { EXPERIENCE as E } from '../content';
import { SplitWords } from './ui';

function ProductCards({ products }) {
  return <ul className="experience-product-grid">{products.map(product => (
    <li key={product.name}>
      <a href={product.url} target="_blank" rel="noopener noreferrer">
        <b>{product.name}</b><span>{product.role}</span><p>{product.detail}</p><small>Visit website →</small>
      </a>
    </li>
  ))}</ul>;
}

export default function Experience() {
  const ref = useRef(null);
  const [activeJob, setActiveJob] = useState(E[0].id);
  const currentJob = E.find(job => job.id === activeJob);
  const products = currentJob?.company === 'AllCognix AI Technologies'
    ? E.find(job => job.products)?.products
    : null;

  useGsap(ref, () => {
    const tl = ref.current.querySelector('#tl'), items = tl.querySelectorAll(':scope > li');
    if (motion) gsap.fromTo('.tl-fg', { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: { trigger: tl, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    items.forEach((li, i) => {
      ScrollTrigger.create({
        trigger: li, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => { li.classList.add('on'); setActiveJob(E[i].id); },
        onEnterBack: () => { li.classList.add('on'); setActiveJob(E[i].id); },
        onLeaveBack: () => { li.classList.remove('on'); setActiveJob(E[Math.max(0, i - 1)].id); },
      });
      if (motion) gsap.from(li.children, { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top bottom', once: true } });
    });
  }, []);

  return (
    <section className="exp" id="experience" data-section="subgraph" aria-labelledby="h-exp" ref={ref}>
      <div className="fit">
      <div className="exp-side">
        <SplitWords className="h-big" id="h-exp" text="Experience" />
        <p className="muted">Career timeline · 2025–present</p>
        {products && <div className="exp-products" key={activeJob}>
          <h2>Products worked on</h2>
          <ProductCards products={products} />
        </div>}
      </div>
      <div className="exp-main">
        <ol className="tl" id="tl">
          <svg className="tl-svg" viewBox="0 0 3 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="tl-bg" d="M1.5 0V100" vectorEffect="non-scaling-stroke" />
            <path className="tl-fg" d="M1.5 0V100" vectorEffect="non-scaling-stroke" />
          </svg>
          {E.map(job => (
            <li key={`${job.company}-${job.role}`} id={`job-${job.id}`}>
              <header className="tl-head">
                <div><h3>{job.role}</h3><p className="tl-company">{job.company}</p></div>
              <p className="tl-date"><strong>{job.dates}</strong>{job.location.map(line => <span key={line}>{line}</span>)}</p>
              </header>
              {job.summary && <p className="tl-summary">{job.summary}</p>}
              <ul className="tl-outcomes">
                {job.outcomes.map(([title, detail]) => <li key={title}><b>{title}</b><p>{detail}</p></li>)}
              </ul>
              {job.products && <div className="tl-products">
                <h4>Products worked on</h4>
                <ProductCards products={job.products} />
              </div>}
              {job.certificate && <a className="tl-certificate" href={job.certificate} target="_blank" rel="noopener noreferrer">View internship certificate →</a>}
            </li>
          ))}
        </ol>
      </div>
      </div>
    </section>
  );
}
