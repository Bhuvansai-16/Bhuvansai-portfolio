(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const G = window.gsap, ST = window.ScrollTrigger;
const EMAIL = 'hello@example.com'; // replace with your real email
const FORM_ENDPOINT = ''; // ponytail: empty = open mailto. Set a Formspree/Resend URL to send for real.
const root = document.documentElement;
const motion = !!G && !reduce;
if (G && ST) G.registerPlugin(ST);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (motion && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
  lenis.on('scroll', ST.update);
  G.ticker.add(t => lenis.raf(t * 1000));
  G.ticker.lagSmoothing(0);
}
function goTo(hash) {
  const el = hash === '#top' ? 0 : $(hash);
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else (el === 0 ? scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault(); // bare "#" = placeholder link, stay put
  if (a.getAttribute('href').length > 1) goTo(a.getAttribute('href'));
});

/* ---------- themes ---------- */
const themeBtns = $$('#themes button');
function setTheme(t) {
  root.dataset.theme = t;
  themeBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  try { localStorage.setItem('theme', t); } catch {}
}
let vtCur = null;
function pickTheme(t, from) {
  if (t === root.dataset.theme) return;
  if (!document.startViewTransition || reduce) return setTheme(t);
  const r = from?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add('theming');
  const vt = vtCur = document.startViewTransition(() => setTheme(t));
  vt.ready.then(() => root.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  vt.finished.finally(() => { if (vtCur === vt) root.classList.remove('theming'); }); // an older wipe must not end a newer one
}
themeBtns.forEach(b => b.addEventListener('click', () => pickTheme(b.dataset.t, b)));
setTheme(root.dataset.theme || 'daylight');

/* ---------- nav hide on scroll down ---------- */
const nav = $('#nav');
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('hide', y > lastY && y > 240);
  lastY = y;
}, { passive: true });

/* ---------- word split ---------- */
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function split(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map(w => `<span class="word" aria-hidden="true"><span>${esc(w)}</span></span>`).join(' ');
  return $$('.word>span', el);
}

/* ---------- flying agent ---------- */
const layer = $('#fly');
function fly(from, to, color = 'var(--violet)') {
  if (!motion) return;
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

/* ---------- hero agent graph ---------- */
const hero = $('#top'), hgSvg = $('#hgSvg'), edgesG = $('#hgEdges'), agentsG = $('#hgAgents');
const NS = 'http://www.w3.org/2000/svg';
const gn = {};
$$('.gn').forEach(el => gn[el.classList[1]] = el);
// Circuit tracks: right-angled rails in the side gutters and along the bottom. Nothing runs above the chips.
const EDGES = [['planner', 'retriever'], ['tools', 'verifier'], ['retriever', 'you'], ['verifier', 'you']].map(([a, b]) => ({ a, b, path: edgesG.appendChild(document.createElementNS(NS, 'path')), len: 1 }));
const vias = $('#hgVias');
function railPathD(pts, rad = 22) { // polyline with rounded corners
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], c = pts[i], n = pts[i + 1];
    const k1 = Math.min(rad, Math.hypot(c.x - p.x, c.y - p.y) / 2) / Math.hypot(c.x - p.x, c.y - p.y);
    const k2 = Math.min(rad, Math.hypot(n.x - c.x, n.y - c.y) / 2) / Math.hypot(n.x - c.x, n.y - c.y);
    d += ` L${c.x - (c.x - p.x) * k1} ${c.y - (c.y - p.y) * k1} Q${c.x} ${c.y} ${c.x + (n.x - c.x) * k2} ${c.y + (n.y - c.y) * k2}`;
  }
  const z = pts.at(-1);
  return d + ` L${z.x} ${z.y}`;
}
function buildEdges() {
  const r = hero.getBoundingClientRect(), copy = $('.hero-copy').getBoundingClientRect();
  hgSvg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  const pt = k => { const q = gn[k].getBoundingClientRect(); return { x: q.left - r.left + q.width / 2, y: q.top - r.top + q.height / 2 }; };
  const P = pt('planner'), T = pt('tools'), R = pt('retriever'), V = pt('verifier'), Y = pt('you');
  // side rails sit at the chip centres, or further out if the text block is wider
  const lx = clamp(copy.left - r.left - 28, 12, Math.min(P.x, R.x)), rx = clamp(copy.right - r.left + 28, Math.max(T.x, V.x), r.width - 12);
  const routes = [
    [P, { x: lx, y: P.y }, { x: lx, y: R.y }, R],
    [T, { x: rx, y: T.y }, { x: rx, y: V.y }, V],
    [R, { x: R.x, y: Y.y }, Y],
    [V, { x: V.x, y: Y.y }, Y],
  ];
  let dots = '';
  EDGES.forEach((e, i) => {
    const pts = routes[i].filter((p, k, a) => !k || Math.hypot(p.x - a[k - 1].x, p.y - a[k - 1].y) > 1);
    e.path.setAttribute('d', railPathD(pts));
    e.len = e.path.getTotalLength();
    pts.slice(1, -1).forEach(p => dots += `<circle cx="${p.x}" cy="${p.y}" r="3.5"/>`);
  });
  vias.innerHTML = dots;
}
buildEdges();
addEventListener('resize', buildEdges);

const AG_COLORS = ['var(--violet)', 'var(--orange)', '#7FB800', 'var(--pink)', 'var(--sky)'];
const agents = AG_COLORS.map((color, i) => {
  const g = document.createElementNS(NS, 'g');
  g.style.color = color;
  const tail = Array.from({ length: 8 }, (_, k) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 4.2 * (1 - k / 9)); c.setAttribute('fill', 'currentColor'); c.setAttribute('opacity', ((1 - k / 9) * 0.55).toFixed(2)); g.append(c); return c; });
  const plane = document.createElementNS(NS, 'g');
  plane.innerHTML = '<use href="#plane" width="26" height="26" x="-13" y="-13"/>';
  g.append(plane);
  agentsG.append(g);
  return { g, tail, plane, e: i % EDGES.length, dir: i % 2 ? -1 : 1, t: Math.random(), v: rand(110, 170) };
});
function posOn(ag, t) {
  const e = EDGES[ag.e], L = clamp(t, 0, 1) * e.len;
  return e.path.getPointAtLength(ag.dir > 0 ? L : e.len - L);
}
function pulse(k) { const el = gn[k]; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
function stepAgents(dt) {
  agents.forEach(ag => {
    ag.t += (ag.v * dt) / EDGES[ag.e].len;
    if (ag.t >= 1) {
      const e = EDGES[ag.e], at = ag.dir > 0 ? e.b : e.a;
      pulse(at);
      const opts = EDGES.map((x, i) => i).filter(i => i !== ag.e && (EDGES[i].a === at || EDGES[i].b === at));
      ag.e = opts[Math.floor(Math.random() * opts.length)] ?? ag.e;
      ag.dir = EDGES[ag.e].a === at ? 1 : -1;
      ag.t = 0;
    }
    const p = posOn(ag, ag.t), n = posOn(ag, ag.t + 0.02);
    ag.plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${Math.atan2(n.y - p.y, n.x - p.x) * 57.2958})`);
    ag.tail.forEach((c, k) => { const q = posOn(ag, ag.t - (k + 1) * 0.022); c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); });
  });
}
let heroVisible = true;
new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(hero);
if (motion) {
  G.ticker.add((t, dms) => { if (heroVisible) stepAgents(Math.min(dms, 50) / 1000); });
  $$('.gn-in').forEach((el, i) => G.to(el, { y: i % 2 ? 7 : -7, duration: rand(2.4, 3.4), yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  if (fine) {
    const gx = G.quickTo('#heroGraph', 'x', { duration: 1.2, ease: 'power3' }), gy = G.quickTo('#heroGraph', 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('mousemove', e => { gx((e.clientX / innerWidth - 0.5) * -24); gy((e.clientY / innerHeight - 0.5) * -18); });
  }
} else stepAgents(0);

/* hero entrance + scroll out */
const heroWords = split($('#h-hero'));
if (motion) {
  const tl = G.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(heroWords, { yPercent: 115, duration: 1.2, stagger: 0.05 })
    .from('.hero-tag', { y: 16, opacity: 0, duration: 0.9 }, 0.1)
    .from(['.hero-sub', '.hero-cta'], { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.45)
    .from('.gn', { scale: 0.6, opacity: 0, duration: 1, stagger: 0.08 }, 0.3)
    .from(['#hgEdges', '#hgVias'], { opacity: 0, duration: 1.2 }, 0.7);
  G.to('.hero-copy', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- marquee ---------- */
const PILL = { a: '#C9BEFF', b: '#D6F57A', c: '#FFB894', d: '#FFB3D6', e: '#A8E1FF' };
const skills = $$('#skillSource li').map(li => ({ name: li.textContent, g: li.dataset.g }));
const pillHTML = list => list.map(s => `<span class="pill" style="--p:${PILL[s.g]}" aria-hidden="true"><i><svg width="13" height="13"><use href="#plane"/></svg></i>${esc(s.name)}</span>`).join('');
const half = Math.ceil(skills.length / 2);
$$('.mq-row').forEach((row, i) => {
  const list = i ? skills.slice(half).concat(skills.slice(0, 3)) : skills.slice(0, half);
  row.innerHTML = pillHTML(list).repeat(4);
});

/* ---------- section headings + statement ---------- */
$$('[data-split]:not(#h-hero)').forEach(el => {
  const w = split(el);
  if (motion) G.from(w, { yPercent: 115, duration: 1.1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
});
const st = $('#statement');
const stText = st.textContent.trim();
st.innerHTML = stText.split(/\s+/).map(w => `<span class="w">${esc(w)}</span>`).join(' ');
if (motion) {
  G.fromTo($$('.w', st), { opacity: 0.15 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  G.utils.toArray('.facts, .about-links, .sec-head p, .exp-side p, .ct-sub, .ct-grid').forEach(el =>
    G.from(el, { y: 32, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
}

/* ---------- about portrait: clip reveal, stickers, tilt ---------- */
const portrait = $('#portrait');
if (motion) {
  G.timeline({ scrollTrigger: { trigger: portrait, start: 'top 80%', once: true }, defaults: { ease: 'expo.out' } })
    .from('#pClipRect', { attr: { y: 490, height: 0 }, duration: 1.4, ease: 'expo.inOut' })
    .from('#pInner', { scale: 1.3, svgOrigin: '240 265', duration: 1.8 }, 0.2)
    .from('.ring', { opacity: 0, duration: 1 }, 0.7)
    .from('.sticker', { scale: 0.4, opacity: 0, duration: 1, stagger: 0.12 }, 0.9);
  $$('.sticker').forEach((s, i) => G.to(s, { y: i % 2 ? 40 : -50, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true } }));
  if (fine) {
    G.set(portrait, { transformPerspective: 900 });
    const ry = G.quickTo(portrait, 'rotationY', { duration: 0.8, ease: 'power3' }), rx = G.quickTo(portrait, 'rotationX', { duration: 0.8, ease: 'power3' });
    portrait.addEventListener('mousemove', e => { const r = portrait.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(((e.clientY - r.top) / r.height - 0.5) * -12); });
    portrait.addEventListener('mouseleave', () => { ry(0); rx(0); });
  }
}

/* ---------- project cards: generated SVG diagrams ---------- */
const cards = $$('.pcard');
cards.forEach((card, ci) => {
  card.style.setProperty('--i', ci);
  const labels = card.dataset.flow.split(','), n = labels.length, W = 460, H = 300;
  const pts = labels.map((l, i) => ({ l, x: 64 + (i * (W - 128)) / (n - 1), y: (i + ci) % 2 ? 206 : 112 }));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < n; i++) { const a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2; d += ` C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`; }
  const dur = (n * 0.85).toFixed(2);
  const nodes = pts.map(p => { const w = p.l.length * 7.8 + 30; return `<g class="nd"><rect x="${p.x - w / 2}" y="${p.y - 19}" width="${w}" height="38" rx="12"/><text x="${p.x}" y="${p.y + 4.5}">${esc(p.l)}</text></g>`; }).join('');
  $('.pc-art', card).innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Flow: ${esc(labels.join(' to '))}">
    <text x="26" y="38" font-family="Geist Mono, monospace" font-size="12" fill="#0E0E12" opacity=".6">run · ${n} steps · ok</text>
    <circle cx="${W - 32}" cy="34" r="5" fill="#2FB344"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle>
    <path class="edge" d="${d}"/>
    <circle class="pkt" r="8"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${d}"/></circle>
    <circle class="pkt" r="5" opacity=".5"><animateMotion dur="${dur}s" begin="-${(dur / 2).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>
    ${nodes}</svg>`;
  if (motion) G.from($$('.nd', card), { opacity: 0, y: 18, duration: 0.9, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 75%', once: true } });
});
if (motion) {
  G.matchMedia().add('(min-width: 900px)', () => {
    cards.slice(0, -1).forEach((card, i) => {
      G.to(card, { scale: 0.9 + i * 0.025, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: `top ${96 + (i + 1) * 18}px`, scrub: true } });
    });
  });
}

/* ---------- experience timeline ---------- */
const tlEl = $('#tl');
tlEl.insertAdjacentHTML('afterbegin', '<svg class="tl-svg" viewBox="0 0 3 100" preserveAspectRatio="none" aria-hidden="true"><path class="tl-bg" d="M1.5 0V100" vector-effect="non-scaling-stroke"/><path class="tl-fg" d="M1.5 0V100" vector-effect="non-scaling-stroke"/></svg>');
const tlItems = $$('li', tlEl);
if (motion) {
  G.fromTo('.tl-fg', { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: { trigger: tlEl, start: 'top 60%', end: 'bottom 60%', scrub: true } });
  tlItems.forEach(li => {
    ST.create({ trigger: li, start: 'top 60%', onEnter: () => li.classList.add('on'), onLeaveBack: () => li.classList.remove('on') });
    G.from(li.children, { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 82%', once: true } });
  });
} else { tlItems.forEach(li => li.classList.add('on')); }
if (reduce) $$('animateMotion').forEach(a => a.parentNode.remove());

/* ---------- checks ---------- */
const checkItems = $$('.checks li');
if (motion) ST.batch(checkItems, { start: 'top 85%', once: true, onEnter: els => els.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 150)) });
else checkItems.forEach(el => el.classList.add('in'));

/* ---------- GitHub contribution calendar ---------- */
// Prefers data/github.json (written by scripts/github.mjs with your token, which never ships to the browser).
// Falls back to GitHub's public calendar via a no-token endpoint. Both use { total: {year: n}, contributions: [{date, count, level}] }.
const GH_USER = 'Bhuvansai-16';
const ghCard = $('#ghCard'), ghGrid = $('#ghGrid'), ghTip = $('#ghTip'), ghScroll = $('#ghScroll');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const today = new Date().toISOString().slice(0, 10), thisYear = +today.slice(0, 4);
const gh = { data: null, year: thisYear, shown: 0, seen: false };
const dayName = iso => new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function ghRender(y) {
  const byDate = new Map((gh.data?.contributions || []).filter(d => d.date.startsWith(y)).map(d => [d.date, d]));
  const S = 16, C = 12, LX = 30, TY = 20;
  let cells = '', labels = '', i = new Date(Date.UTC(y, 0, 1)).getUTCDay(); // rows run Sun..Sat like GitHub
  for (const d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d.setUTCDate(d.getUTCDate() + 1), i++) {
    const iso = d.toISOString().slice(0, 10), v = byDate.get(iso) || { count: 0, level: 0 }, x = LX + Math.floor(i / 7) * S;
    if (d.getUTCDate() === 1) labels += `<text x="${x}" y="12">${MON[d.getUTCMonth()]}</text>`;
    cells += `<rect x="${x}" y="${TY + (i % 7) * S}" width="${C}" height="${C}" rx="3" data-l="${v.level}" data-c="${v.count}" data-d="${iso}"${iso > today ? ' class="future"' : ''}/>`;
  }
  labels += ['Mon', 'Wed', 'Fri'].map((t, k) => `<text x="0" y="${TY + (2 * k + 1) * S + 10}">${t}</text>`).join('');
  ghGrid.setAttribute('viewBox', `0 0 ${LX + Math.ceil(i / 7) * S} ${TY + 7 * S}`);
  ghGrid.innerHTML = `${labels}<g>${cells}</g>`;
}
function ghShow(y) {
  gh.year = y;
  ghRender(y);
  const total = gh.data.total[y] ?? 0, past = gh.data.contributions.filter(d => d.date <= today);
  let cur = 0; // current streak: today may still be empty
  for (let k = past.length - 1; k >= 0; k--) { if (past[k].count) cur++; else if (past[k].date !== today) break; }
  let long = 0, run = 0, best = { count: 0 };
  for (const d of past) if (d.date.startsWith(y)) { run = d.count ? run + 1 : 0; long = Math.max(long, run); if (d.count > best.count) best = d; }
  $('#ghLabel').textContent = `contributions in ${y}`;
  ghGrid.setAttribute('aria-label', `${total} GitHub contributions in ${y}`);
  $('#ghCur').textContent = plural(cur, 'day');
  $('#ghLong').textContent = plural(long, 'day');
  $('#ghBest').textContent = best.count ? `${best.count} on ${dayName(best.date)}` : '-';
  $$('#ghYears button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === y));
  ghScroll.scrollLeft = y === thisYear ? ghScroll.scrollWidth * ((Date.now() - Date.UTC(y, 0, 1)) / 31536e6) - ghScroll.clientWidth / 2 : 0;
}
function ghPlay(fast) {
  const total = gh.data.total[gh.year] ?? 0, el = $('#ghTotal');
  if (!motion) { el.textContent = total; return; }
  const o = { v: gh.shown };
  G.to(o, { v: total, duration: 1.2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v) });
  gh.shown = total;
  G.from($$('rect', ghGrid), { opacity: 0, scale: 0.2, transformOrigin: '50% 50%', duration: 0.6, ease: 'expo.out', stagger: fast ? 0.0008 : 0.0025 });
}
async function ghLoad() {
  const urls = ['data/github.json', `https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=${thisYear - 2}&y=${thisYear - 1}&y=${thisYear}`];
  let src = '';
  for (const [k, url] of urls.entries()) {
    try { const r = await fetch(url); if (r.ok) { gh.data = await r.json(); src = k ? 'live' : 'json'; break; } } catch {}
  }
  const chip = $('#ghChip').lastChild;
  if (!gh.data?.contributions?.length) {
    ghCard.dataset.state = 'error'; chip.textContent = 'Offline';
    $('#ghMsg').innerHTML = `Couldn't load GitHub data right now. <a href="https://github.com/${GH_USER}" rel="noopener">See the profile on GitHub</a>.`;
    return;
  }
  gh.data.contributions.sort((a, b) => (a.date < b.date ? -1 : 1));
  const years = Object.keys(gh.data.total).map(Number).sort();
  $('#ghYears').innerHTML = years.map(y => `<button type="button" data-y="${y}">${y}</button>`).join('');
  chip.textContent = src === 'json' && gh.data.updated ? `Synced ${dayName(gh.data.updated)}` : 'Live GitHub data';
  ghCard.dataset.state = 'ready';
  ghShow(years.includes(thisYear) ? thisYear : years.at(-1));
  if (gh.seen || !motion) ghPlay(false);
  ST?.refresh();
}
ghRender(thisYear); // empty grid while loading, so nothing jumps
ghLoad();
if (motion) ST.create({ trigger: ghCard, start: 'top 75%', once: true, onEnter: () => { gh.seen = true; if (gh.data) ghPlay(false); } });
$('#ghYears').addEventListener('click', e => { const b = e.target.closest('button'); if (b && +b.dataset.y !== gh.year) { ghShow(+b.dataset.y); ghPlay(true); } });
ghGrid.addEventListener('pointerover', e => {
  const c = e.target.closest('rect');
  if (!c || !gh.data) return;
  const n = +c.dataset.c, r = c.getBoundingClientRect(), b = ghCard.getBoundingClientRect();
  ghTip.textContent = `${n || 'No'} contribution${n === 1 ? '' : 's'} on ${dayName(c.dataset.d)}`;
  ghTip.style.left = clamp(r.left - b.left + r.width / 2, 90, b.width - 90) + 'px';
  ghTip.style.top = r.top - b.top - 8 + 'px';
  ghTip.classList.add('on');
});
ghGrid.addEventListener('pointerleave', () => ghTip.classList.remove('on'));

/* ---------- certification badges ---------- */
if (motion) {
  ST.batch('.badges li', { start: 'top 88%', once: true, onEnter: els => G.from(els, { y: 48, opacity: 0, scale: 0.8, duration: 1, stagger: 0.08, ease: 'expo.out' }) });
  ST.batch('.b-check', { start: 'top 88%', once: true, onEnter: els => G.from(els, { scale: 0, duration: 0.6, stagger: 0.08, delay: 0.5, ease: 'expo.out' }) });
}

/* ---------- contact drift ---------- */
const drift = $('#drift');
for (let i = 0; i < 9; i++) {
  const s = Math.round(rand(16, 34));
  drift.insertAdjacentHTML('beforeend', `<svg width="${s}" height="${s}" style="left:${rand(4, 94)}%;top:${rand(6, 92)}%;transform:rotate(${rand(-40, 40)}deg)"><use href="#plane"/></svg>`);
}
if (motion) $$('svg', drift).forEach(el => G.to(el, { x: rand(-140, 140), y: rand(-90, 90), rotation: `+=${rand(-30, 30)}`, duration: rand(6, 11), yoyo: true, repeat: -1, ease: 'sine.inOut' }));

/* ---------- footer wordmark + back to top ---------- */
const wm = $('#wordmark'), WM_C = ['var(--lime)', 'var(--orange)', 'var(--pink)', 'var(--sky)'];
wm.innerHTML = [...wm.textContent.trim()].map((c, i) => `<span style="--h:${WM_C[i % 4]}">${esc(c)}</span>`).join('');
if (motion) G.from($$('span', wm), { yPercent: 105, duration: 1.3, stagger: 0.045, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: wm, start: 'top bottom', once: true } });
$('#toTop').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  fly({ x: r.left + r.width / 2, y: r.top }, $('.logo-mark'), 'var(--lime)');
  goTo('#top');
});

/* ---------- nav: sliding pill on the active section ---------- */
const navLinks = $$('.nav-links a'), navPill = $('.nav-pill');
function markNav(id) {
  const a = navLinks.find(l => l.getAttribute('href') === '#' + id && l.offsetWidth);
  navLinks.forEach(l => l === a ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'));
  navPill.style.opacity = a ? 1 : 0;
  if (a) { navPill.style.width = a.offsetWidth + 'px'; navPill.style.transform = `translateX(${a.offsetLeft}px)`; }
}

/* ---------- progress rail ---------- */
const secs = $$('[data-section]');
const SEC_C = { planner: 'var(--violet)', retriever: '#7FB800', tools: 'var(--orange)', memory: '#2FB344', subgraph: 'var(--sky)', verifier: 'var(--pink)', evals: '#FFB900', interrupt: 'var(--lime)' };
const rail = $('#rail');
let railPath, railLen = 1, railAgent, railDots = [], railCur = 0, railTarget = 0;
function buildRail() {
  const H = rail.clientHeight || 400, segs = 10;
  let d = 'M17 0';
  for (let i = 1; i <= segs; i++) { const y0 = ((i - 1) * H) / segs, y1 = (i * H) / segs, x = i % 2 ? 30 : 4; d += ` C${x} ${y0 + (y1 - y0) * 0.3} ${x} ${y0 + (y1 - y0) * 0.7} 17 ${y1}`; }
  rail.innerHTML = `<svg viewBox="0 0 34 ${H}"><path class="track" d="${d}"/>${secs.map((s, i) => `<g data-i="${i}"><circle class="rdot" r="6" style="--c:${SEC_C[s.dataset.section]}"/><text class="rlabel" x="-8" y="4">${s.dataset.section}</text></g>`).join('')}<g class="agent"><use href="#plane" width="24" height="24" x="-12" y="-12"/></g></svg>`;
  railPath = $('.track', rail); railLen = railPath.getTotalLength(); railAgent = $('.agent', rail);
  railDots = $$('g[data-i]', rail).map((g, i) => {
    const p = railPath.getPointAtLength((i / (secs.length - 1)) * railLen);
    $('circle', g).setAttribute('cx', p.x); $('circle', g).setAttribute('cy', p.y);
    $('text', g).setAttribute('y', p.y + 4); $('text', g).setAttribute('x', p.x - 14);
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => goTo('#' + secs[i].id));
    return $('circle', g);
  });
}
buildRail();
addEventListener('resize', buildRail);

const run = { visited: new Set(['top']), start: Date.now(), cur: 0 };
const announce = $('#announce');
const flown = new Set(['top']);
function progress() {
  const line = scrollY + innerHeight * 0.4;
  const tops = secs.map(s => s.getBoundingClientRect().top + scrollY);
  let i = 0;
  tops.forEach((t, k) => { if (t <= line) i = k; });
  let f = i < secs.length - 1 ? clamp((line - tops[i]) / (tops[i + 1] - tops[i]), 0, 1) : 0;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { i = secs.length - 1; f = 0; }
  return { i, f };
}
function railTick() {
  const { i, f } = progress();
  railTarget = (i + f) / (secs.length - 1);
  railCur += (railTarget - railCur) * (reduce ? 1 : 0.12);
  const p = railPath.getPointAtLength(railCur * railLen), q = railPath.getPointAtLength(Math.min(railLen, railCur * railLen + 2));
  railAgent.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 57.2958 || 90})`);
  railDots.forEach((d, k) => d.classList.toggle('on', k <= i));
  rail.classList.toggle('show', scrollY > innerHeight * 0.6);
  if (i !== run.cur) {
    run.cur = i;
    const sec = secs[i];
    run.visited.add(sec.id);
    markNav(sec.id);
    announce.textContent = `Now at ${sec.dataset.section}`;
    if (!flown.has(sec.id)) {
      flown.add(sec.id);
      const target = $('.h-big, .mega, .statement', sec);
      const r = railAgent.getBoundingClientRect();
      if (target && r.width) fly({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, target, SEC_C[sec.dataset.section]);
    }
  }
}
if (G) G.ticker.add(railTick); else addEventListener('scroll', railTick, { passive: true });
railTick();

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
setInterval(() => { $('#summary').textContent = `Run complete · ${run.visited.size} of ${secs.length} stops · ${fmt((Date.now() - run.start) / 1000)}`; }, 1000);

/* ---------- magnetic buttons ---------- */
if (motion && fine) $$('[data-magnet]').forEach(el => {
  const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
  el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); });
  el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
});

/* ---------- contact form ---------- */
const form = $('#contactForm'), fstat = $('#formStatus'), send = $('#sendBtn');
$('#emailLink').href = 'mailto:' + EMAIL;
function fieldErr(id, msg) {
  const f = $('#' + id), e = $('#e' + id.slice(1));
  e.textContent = msg; f.setAttribute('aria-invalid', !!msg);
  return !msg;
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  const ok = [
    fieldErr('cName', v.name.trim() ? '' : 'Enter your name.'),
    fieldErr('cEmail', /^\S+@\S+\.\S+$/.test(v.email) ? '' : 'Enter a valid email address.'),
    fieldErr('cMsg', v.message.trim().length >= 10 ? '' : 'Write at least a sentence (10 characters).'),
  ];
  if (ok.includes(false)) { $('[aria-invalid=true]', form).focus(); return; }
  send.disabled = true; send.firstChild.textContent = 'Sending… '; fstat.className = 'form-status'; fstat.textContent = '';
  try {
    if (FORM_ENDPOINT) {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(v) });
      if (!r.ok) throw new Error(r.status);
    } else {
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Portfolio message from ' + v.name)}&body=${encodeURIComponent(v.message + '\n\n' + v.email)}`;
    }
    fstat.textContent = 'Message sent. Run complete.';
    send.firstChild.textContent = 'Sent ';
    const r = send.getBoundingClientRect();
    fly({ x: r.left + r.width / 2, y: r.top }, $('#summary'), 'var(--lime)');
  } catch {
    fstat.className = 'form-status error';
    fstat.textContent = `Message didn't send. Check your connection and try again, or email ${EMAIL}.`;
    send.disabled = false; send.firstChild.textContent = 'Send message ';
  }
});
async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = o, 1500); } catch {}
}
$('#copyEmail').addEventListener('click', e => copy(EMAIL, e.currentTarget));

/* ---------- chat (local retrieval; swap ask() body for an API call later) ---------- */
const grams = s => { s = ' ' + s.toLowerCase() + ' '; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; };
function sim(q, t) {
  const a = grams(q), b = grams(t);
  let n = 0; a.forEach(x => b.has(x) && n++);
  return Math.min(1, (n / Math.sqrt((a.size * b.size) || 1)) * 1.5 + (t.includes(q.toLowerCase().trim()) ? 0.5 : 0));
}
const KB = [
  { t: 'agents built projects research agent langgraph tool calling', a: 'I build agents that plan, call tools, and verify their own output. The research agent uses a planner and three workers with cited sources.', src: ['work'] },
  { t: 'skills stack technologies python fastapi pytorch languages use most', a: 'Day to day: Python, FastAPI, LangGraph, vector search, and PyTorch.', src: ['skills', 'about'] },
  { t: 'about you who are you background hobbies based where location live', a: "I'm Bhuvansai, an AI engineer based in [City]. Off the clock: [two things you do for fun].", src: ['about'] },
  { t: 'internship experience work company role', a: '[Role] at [Company]: I owned a multi-agent system end to end. The experience section has the architecture and outcomes.', src: ['experience'] },
  { t: 'github contributions commits activity open source streak calendar', a: 'My GitHub activity is in the shipping log: a live contribution calendar with streaks and my busiest day.', src: ['github'] },
  { t: 'certifications certificates badges courses aws google cloud gcp microsoft kaggle coursera', a: 'Certifications from Google Developers, Kaggle, Coursera, Microsoft, AWS, and Google Cloud are in the badges section. [Name your top one here.]', src: ['certifications'] },
  { t: 'education degree university college achievements awards', a: '[Degree] at [Institution], plus [Achievement 1] and [Achievement 2].', src: ['education'] },
  { t: 'contact email hire reach resume linkedin github', a: `Email works best: ${EMAIL}. The form at the end of the page reaches me too.`, src: ['contact'] },
  { t: 'evaluation eval testing quality regressions', a: 'I treat evals as part of the product. The eval harness replays runs against a golden set and flags regressions per tool call.', src: ['work'] },
  { t: 'retrieval rag documents search embeddings', a: 'Document Q&A pairs embeddings with reranking and page-level citations.', src: ['work'] },
];
const chat = $('#chat'), log = $('#chatLog'), cin = $('#chatInput'), chatBtn = $('#chatBtn');
let asked = 0;
function setChat(open) {
  chat.classList.toggle('open', open); chatBtn.setAttribute('aria-expanded', open);
  if (lenis) open ? lenis.stop() : lenis.start();
  if (open) setTimeout(() => cin.focus(), 300); else chatBtn.focus();
}
chatBtn.addEventListener('click', () => setChat(!chat.classList.contains('open')));
$('#heroChat').addEventListener('click', () => setChat(true));
$('#chatClose').addEventListener('click', () => setChat(false));
$$('#suggest button').forEach(c => c.addEventListener('click', () => ask(c.textContent)));
$('#chatForm').addEventListener('submit', e => { e.preventDefault(); ask(cin.value); cin.value = ''; });
function ask(q) {
  q = q.trim(); if (!q) return;
  $('#suggest')?.remove();
  const qm = document.createElement('div'); qm.className = 'msg q'; qm.textContent = q; log.append(qm);
  const m = document.createElement('div'); m.className = 'msg a'; log.append(m);
  log.scrollTop = log.scrollHeight;
  if (++asked > 12) { m.innerHTML = '<p>Rate limit reached for this session. Email me instead and I will reply.</p>'; return; }
  const best = KB.map(k => ({ k, v: sim(q, k.t) })).sort((a, b) => b.v - a.v)[0];
  const hit = best.v >= 0.2;
  const text = hit ? best.k.a : "I only answer questions about Bhuvansai's work, skills, and experience. Try one of the topics on the page.";
  m.innerHTML = `<details><summary>trace · retrieve → rank → generate</summary>top match ${best.v.toFixed(2)}${hit ? '' : ' (below threshold)'}</details><p></p>`;
  const p = $('p', m), words = text.split(' ');
  let i = 0;
  const tick = () => {
    p.textContent = words.slice(0, ++i).join(' ');
    log.scrollTop = log.scrollHeight;
    if (i < words.length) setTimeout(tick, reduce ? 0 : 28);
    else if (hit) best.k.src.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'src'; b.textContent = `${s} ↗`;
      b.onclick = () => { setChat(false); goTo('#' + s); };
      m.append(b);
    });
  };
  tick();
}

/* ---------- command menu ---------- */
const pal = $('#palette'), pin = $('#palInput'), plist = $('#palList');
const cmds = [
  ...['top', 'about', 'work', 'github', 'experience', 'education', 'certifications', 'contact'].map(id => ({ n: `Go to ${id === 'top' ? 'start' : id}`, f: () => goTo('#' + id) })),
  ...['daylight', 'midnight', 'citrus', 'grape'].map(t => ({ n: `Theme: ${t}`, f: () => pickTheme(t) })),
  { n: 'Download resume', f: () => { const a = document.createElement('a'); a.href = 'resume.pdf'; a.download = ''; a.click(); } },
  { n: 'Copy email', f: () => navigator.clipboard?.writeText(EMAIL) },
  { n: 'Ask my agent', f: () => setChat(true) },
];
let sel = 0, shown = cmds;
function renderPal() {
  const q = pin.value.toLowerCase();
  shown = cmds.filter(c => c.n.toLowerCase().includes(q));
  sel = clamp(sel, 0, Math.max(0, shown.length - 1));
  plist.innerHTML = shown.map((c, i) => `<li role="option" aria-selected="${i === sel}" data-i="${i}">${c.n}</li>`).join('') || '<li>No match</li>';
}
const runCmd = i => { const c = shown[i]; if (!c) return; pal.close(); c.f(); };
const openPal = () => { pin.value = ''; sel = 0; renderPal(); pal.showModal(); pin.focus(); };
$('#paletteBtn').addEventListener('click', openPal);
pin.addEventListener('input', () => { sel = 0; renderPal(); });
pin.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { sel = (sel + 1) % shown.length; renderPal(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % shown.length; renderPal(); e.preventDefault(); }
  else if (e.key === 'Enter') runCmd(sel);
});
plist.addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) runCmd(+li.dataset.i); });
pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); }
  else if (e.key === 'Escape' && chat.classList.contains('open')) setChat(false);
});

document.fonts?.ready.then(() => { buildEdges(); buildRail(); ST?.refresh(); });
})();
