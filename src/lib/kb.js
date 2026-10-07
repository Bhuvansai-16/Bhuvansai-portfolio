// Offline answers: when the agent can't be reached, Pip falls back to keyword matching over KB.
import { KB, PROFILE } from '../content.js';

// character-trigram overlap
const grams = s => { s = ` ${s.toLowerCase()} `; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; };
function sim(q, t) {
  const a = grams(q), b = grams(t);
  let n = 0;
  a.forEach(x => b.has(x) && n++);
  return Math.min(1, (n / Math.sqrt(a.size * b.size || 1)) * 1.5 + (t.includes(q.toLowerCase().trim()) ? 0.5 : 0));
}

export function answerLocal(q) {
  const best = KB.map(k => ({ k, v: sim(q, k.t) })).sort((a, b) => b.v - a.v)[0];
  return best.v >= 0.28 // real topics score 0.3+; unrelated commands like "switch to grape mode" scored 0.23
    ? { text: best.k.a, src: best.k.src, hit: true }
    : { text: `I only know about ${PROFILE.name}'s work, skills, and experience. Try one of the topics on the page.`, src: [], hit: false };
}
