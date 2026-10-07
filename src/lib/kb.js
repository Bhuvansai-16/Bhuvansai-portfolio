// Offline answers: when the agent can't be reached, Pip falls back to keyword matching over KB.
import { KB, PROFILE } from '../content.js';

// character-trigram overlap
const grams = s => { s = ` ${s.toLowerCase()} `; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; };
const clean = s => s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

function sim(q, t) {
  const cq = clean(q), ct = clean(t);
  const a = grams(cq), b = grams(ct);
  let n = 0;
  a.forEach(x => b.has(x) && n++);
  const qWords = cq.split(/\s+/).filter(w => w.length > 3);
  const tWords = new Set(ct.split(/\s+/));
  let wordMatches = 0;
  for (const w of qWords) if (tWords.has(w)) wordMatches++;
  const bonus = wordMatches > 0 ? Math.min(0.3, wordMatches * 0.15) : 0;
  return Math.min(1, (n / Math.sqrt(a.size * b.size || 1)) * 1.5 + (ct.includes(cq) ? 0.5 : 0) + bonus);
}

const GREETING_RE = /^\s*(hi|hello|hey|howdy|sup|yo|greetings|good\s+(morning|afternoon|evening))\b[\s,!\-.]*(pip\b[\s,!\-.]*)?/i;

export function answerLocal(q) {
  const isGreeting = GREETING_RE.test(q);
  const stripped = q.replace(GREETING_RE, '').replace(/^[!.,\s]+|[!.,\s]+$/g, '').trim();

  if (isGreeting && (!stripped || /^(there|pip)[!.\s]*$/i.test(stripped))) {
    return {
      text: `Hey there! I'm Pip, ${PROFILE.name}'s portfolio droid. Great to meet you! Want me to show you around ${PROFILE.name}'s work, or is there a specific project or skill you'd like to check out?`,
      src: ['work', 'about'],
      hit: true,
    };
  }

  const best = KB.map(k => ({
    k,
    v: Math.max(sim(q, k.t), stripped ? sim(stripped, k.t) : 0),
  })).sort((a, b) => b.v - a.v)[0];

  if (best && best.v >= 0.28) {
    return { text: best.k.a, src: best.k.src, hit: true };
  }

  if (isGreeting) {
    return {
      text: `Hey there! Great to meet you. I'm mainly tuned to chat about ${PROFILE.name}'s work, skills, and experience. What would you like to see?`,
      src: ['work', 'about'],
      hit: true,
    };
  }

  return {
    text: `I'm mainly tuned to chat about ${PROFILE.name}'s work, skills, and experience. Ask me about any of those, or tap one of the suggested topics!`,
    src: [],
    hit: false,
  };
}
