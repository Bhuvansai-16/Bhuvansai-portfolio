import { useEffect, useRef } from 'react';
import { clamp, fly, goTo, scroller, ROLE_COLOR as SEC_C } from '../lib/motion';

// Wavy progress rail on the right: a plane rides it with your scroll, and on reaching a new
// section an agent flies from the rail to that section's heading.
export default function Rail({ onSection }) {
  const ref = useRef(null);
  const cb = useRef(onSection);
  cb.current = onSection;

  useEffect(() => {
    const rail = ref.current, secs = [...document.querySelectorAll('[data-section]')];
    const flown = new Set(['top']);
    let path, len = 1, agent, dots = [], idx = 0, alive = true, frame = 0;

    const build = () => {
      const H = rail.clientHeight || 400, segs = 10;
      let d = 'M17 0';
      for (let i = 1; i <= segs; i++) { const y0 = ((i - 1) * H) / segs, y1 = (i * H) / segs, x = i % 2 ? 30 : 4; d += ` C${x} ${y0 + (y1 - y0) * 0.3} ${x} ${y0 + (y1 - y0) * 0.7} 17 ${y1}`; }
      rail.innerHTML = `<svg viewBox="0 0 34 ${H}"><path class="track" d="${d}"/>${secs.map((s, i) => `<g data-i="${i}"><circle class="rdot" r="6" style="--c:${SEC_C[s.dataset.section]}"/><text class="rlabel" x="-8" y="4">${s.dataset.section}</text></g>`).join('')}<g class="agent"><use href="#plane" width="24" height="24" x="-12" y="-12"/></g></svg>`;
      path = rail.querySelector('.track'); len = path.getTotalLength(); agent = rail.querySelector('.agent');
      dots = [...rail.querySelectorAll('g[data-i]')].map((g, i) => {
        const p = path.getPointAtLength((i / (secs.length - 1)) * len), c = g.querySelector('circle'), t = g.querySelector('text');
        c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
        t.setAttribute('x', p.x - 14); t.setAttribute('y', p.y + 4);
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => goTo('#' + secs[i].id));
        return c;
      });
      queueUpdate();
    };

    const progress = () => {
      const line = scrollY + innerHeight * 0.4, tops = secs.map(s => s.getBoundingClientRect().top + scrollY);
      let i = 0;
      tops.forEach((t, k) => { if (t <= line) i = k; });
      let f = i < secs.length - 1 ? clamp((line - tops[i]) / (tops[i + 1] - tops[i]), 0, 1) : 0;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { i = secs.length - 1; f = 0; }
      return { i, f };
    };

    const update = () => {
      frame = 0;
      if (!alive || !path) return;
      const { i, f } = progress();
      const cur = (i + f) / (secs.length - 1);
      const p = path.getPointAtLength(cur * len), q = path.getPointAtLength(Math.min(len, cur * len + 2));
      agent.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 57.2958 || 90})`);
      dots.forEach((d, k) => d.classList.toggle('on', k <= i));
      rail.classList.toggle('show', scrollY > innerHeight * 0.6);
      if (i === idx) return;
      idx = i;
      const sec = secs[i];
      cb.current?.(sec.id);
      document.getElementById('announce').textContent = `Now at ${sec.dataset.section}`;
      if (flown.has(sec.id)) return;
      flown.add(sec.id);
      const target = sec.querySelector('.h-big, .mega, .statement'), r = agent.getBoundingClientRect();
      if (target && r.width && !scroller.touring) fly({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, target, SEC_C[sec.dataset.section]);
    };
    const queueUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };

    build();
    addEventListener('scroll', queueUpdate, { passive: true });
    addEventListener('resize', build);
    document.fonts?.ready.then(() => alive && build());
    return () => { alive = false; cancelAnimationFrame(frame); removeEventListener('scroll', queueUpdate); removeEventListener('resize', build); rail.innerHTML = ''; };
  }, []);

  return <nav className="rail" id="rail" aria-label="Page progress" ref={ref} />;
}
