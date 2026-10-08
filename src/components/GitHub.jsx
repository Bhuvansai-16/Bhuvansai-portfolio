import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, motion, fine, clamp, useGsap, asset } from '../lib/motion';
import { PROFILE } from '../content';
import { SplitWords } from './ui';

// Data: /api/github (your token, server-side), else public/data/github.json (scripts/github.mjs), else GitHub's
// public calendar via a no-token endpoint. All: { total: {year: n}, contributions: [{date, count, level}] }
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TODAY = new Date().toISOString().slice(0, 10), THIS_YEAR = +TODAY.slice(0, 4);
const S = 16, C = 12, LX = 30, TY = 20; // cell step, cell size, label gutters
const dayName = iso => new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function layoutYear(data, year) {
  const byDate = new Map((data?.contributions || []).filter(d => d.date.startsWith(year)).map(d => [d.date, d]));
  const cells = [], months = [];
  let i = new Date(Date.UTC(year, 0, 1)).getUTCDay(); // rows run Sun..Sat like GitHub
  for (const d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1), i++) {
    const iso = d.toISOString().slice(0, 10), v = byDate.get(iso) || { count: 0, level: 0 }, x = LX + Math.floor(i / 7) * S;
    if (d.getUTCDate() === 1) months.push({ x, m: MON[d.getUTCMonth()] });
    cells.push({ iso, x, y: TY + (i % 7) * S, l: v.level, c: v.count, future: iso > TODAY });
  }
  return { cells, months, w: LX + Math.ceil(i / 7) * S };
}

function stats(data, year) {
  const past = data.contributions.filter(d => d.date <= TODAY);
  let cur = 0; // current streak; today may still be empty
  for (let k = past.length - 1; k >= 0; k--) { if (past[k].count) cur++; else if (past[k].date !== TODAY) break; }
  let long = 0, run = 0, best = { count: 0 };
  for (const d of past) if (d.date.startsWith(year)) { run = d.count ? run + 1 : 0; long = Math.max(long, run); if (d.count > best.count) best = d; }
  return { cur: plural(cur, 'day'), long: plural(long, 'day'), best: best.count ? `${best.count} on ${dayName(best.date)}` : '-' };
}

export default function GitHub() {
  const ref = useRef(null), cardRef = useRef(null), scrollRef = useRef(null), totalRef = useRef(null), sweepRef = useRef(null);
  const shown = useRef(0), played = useRef(false);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [year, setYear] = useState(THIS_YEAR);
  const [seen, setSeen] = useState(!motion || !fine || innerWidth < 700);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    // Live from /api/github (cached ~10 min), else the file the nightly Action writes. Both count private
    // contributions; the public feed doesn't, so it is the last resort.
    const load = async () => {
      const years = Array.from({ length: THIS_YEAR - 2023 + 1 }, (_, i) => `y=${2023 + i}`).join('&');
      for (const url of ['/api/github', asset('data/github.json'), `https://github-contributions-api.jogruber.de/v4/${PROFILE.github}?${years}`]) {
        try {
          const r = await fetch(url, { signal: ac.signal });
          const d = r.ok ? await r.json() : null;
          if (!d?.contributions?.length) continue;
          d.contributions.sort((a, b) => (a.date < b.date ? -1 : 1));
          const ys = Object.keys(d.total).map(Number).sort((a, b) => a - b);
          setData(d);
          setYear(ys.includes(THIS_YEAR) ? THIS_YEAR : ys.at(-1));
          setStatus('ready');
          return;
        } catch { if (ac.signal.aborted) return; }
      }
      setStatus('error');
    };
    let observer;
    const start = () => {
      observer?.disconnect();
      load();
    };
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { rootMargin: '600px 0px' });
      observer.observe(ref.current);
    } else {
      start();
    }
    return () => {
      observer?.disconnect();
      ac.abort();
    };
  }, []);

  const cal = useMemo(() => layoutYear(data, year), [data, year]);
  // built once per year, so hovering (which re-renders for the tooltip) doesn't touch 365 squares
  const cells = useMemo(() => cal.cells.map(c => (
    <rect key={c.iso} x={c.x} y={c.y} width={C} height={C} rx="3" data-l={c.l} data-c={c.c} data-d={c.iso} className={c.future ? 'future' : undefined} />
  )), [cal]);
  const st = useMemo(() => (data ? stats(data, year) : null), [data, year]);
  const total = data?.total[year] ?? 0;

  useEffect(() => { if (status !== 'loading') ScrollTrigger.refresh(); }, [status]);

  // on phones the grid scrolls sideways: open it at today
  useLayoutEffect(() => {
    const s = scrollRef.current;
    s.scrollLeft = year === THIS_YEAR ? s.scrollWidth * ((Date.now() - Date.UTC(year, 0, 1)) / 31536e6) - s.clientWidth / 2 : 0;
  }, [year, status]);

  useGsap(ref, () => {
    if (motion && fine && innerWidth >= 700) ScrollTrigger.create({ trigger: cardRef.current, start: 'top 75%', once: true, onEnter: () => setSeen(true) });
  }, []);

  // count up the total and sweep the squares in, left to right. One clip rectangle grows across the year
  // (365 separately scaled squares each measured themselves with getBBox and restyled every frame).
  useGsap(ref, () => {
    if (!data || !seen) return;
    if (!motion || !fine || innerWidth < 700) { totalRef.current.textContent = total; return; }
    const o = { v: shown.current }, el = totalRef.current;
    gsap.to(o, { v: total, duration: 1.2, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v)) });
    shown.current = total;
    gsap.fromTo(sweepRef.current, { attr: { width: 0 } }, { attr: { width: cal.w }, duration: played.current ? 0.6 : 1.1, ease: 'power2.out' });
    played.current = true;
  }, [data, seen, year]);

  const onOver = e => {
    const c = e.target.closest('rect');
    if (!c || !data) return;
    const n = +c.dataset.c, r = c.getBoundingClientRect(), b = cardRef.current.getBoundingClientRect();
    const z = cardRef.current.currentCSSZoom || 1; // the section may be zoomed down to fit the screen
    setTip({ on: true, text: `${n || 'No'} contribution${n === 1 ? '' : 's'} on ${dayName(c.dataset.d)}`, x: clamp(r.left - b.left + r.width / 2, 90, b.width - 90) / z, y: (r.top - b.top - 8) / z });
  };

  return (
    <section className="gh screen" id="github" data-section="memory" aria-labelledby="h-gh" ref={ref}>
      <div className="fit">
      <div className="sec-head">
        <SplitWords className="h-big" id="h-gh" text="Shipping log" />
        <p className="muted">Every square is a day of commits, pull requests, and reviews on GitHub.</p>
      </div>
      <div className="gh-card" id="ghCard" data-state={status} ref={cardRef}>
        <div className="gh-top">
          <a className="gh-id" href={`https://github.com/${PROFILE.github}`} rel="noopener">
            <span className="gh-mark"><svg width="26" height="26" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg></span>
            <span className="gh-total"><b ref={totalRef}>0</b><small>{data ? `contributions in ${year}` : 'contributions'}</small></span>
          </a>
          <div className="gh-years" role="group" aria-label="Year">
            {data && Object.keys(data.total).map(Number).sort().map(y => (
              <button key={y} type="button" aria-pressed={y === year} onClick={() => y !== year && setYear(y)}>{y}</button>
            ))}
          </div>
        </div>
        <div className="gh-scroll" ref={scrollRef} role="region" aria-label="GitHub contribution calendar; scroll horizontally" tabIndex={0}>
          <svg className="gh-grid" viewBox={`0 0 ${cal.w} ${TY + 7 * S}`} role="img" aria-label={data ? `${total} GitHub contributions in ${year}` : 'GitHub contribution calendar'}
            onPointerOver={onOver} onPointerLeave={() => setTip(t => t && { ...t, on: false })}>
            {cal.months.map(m => <text key={m.m} x={m.x} y="12">{m.m}</text>)}
            {['Mon', 'Wed', 'Fri'].map((t, k) => <text key={t} x="0" y={TY + (2 * k + 1) * S + 10}>{t}</text>)}
            <defs><clipPath id="gh-sweep"><rect ref={sweepRef} x="0" y="0" width={cal.w} height={TY + 7 * S} /></clipPath></defs>
            <g clipPath="url(#gh-sweep)">{cells}</g>
          </svg>
        </div>
        <p className="gh-swipe">Swipe to see the full year →</p>
        <div className="gh-foot">
          <dl className="gh-stats">
            <div><dt>Current streak</dt><dd>{st?.cur ?? '-'}</dd></div>
            <div><dt>Longest streak</dt><dd>{st?.long ?? '-'}</dd></div>
            <div><dt>Busiest day</dt><dd>{st?.best ?? '-'}</dd></div>
          </dl>
          <p className="gh-legend" aria-hidden="true">Less {[0, 1, 2, 3, 4].map(l => <i key={l} data-l={l} />)} More</p>
        </div>
        <p className="gh-msg" role="status">
          {status === 'error' && <>Couldn't load GitHub data right now. <a href={`https://github.com/${PROFILE.github}`} rel="noopener">See the profile on GitHub</a>.</>}
        </p>
        <div className={`gh-tip${tip?.on ? ' on' : ''}`} style={tip ? { left: tip.x, top: tip.y } : undefined} aria-hidden="true">{tip?.text}</div>
      </div>
      <p className="gh-cta muted">Want to dive deeper? <a href="#contact">Scroll to contact and let's chat.</a></p>
      </div>
    </section>
  );
}
