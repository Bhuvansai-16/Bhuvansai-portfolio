// Writes public/data/github.json (your contribution calendar) using your GitHub token.
// The site reads the live calendar from /api/github; this file is its fallback (and what `npm run dev` shows).
// Run: npm run github   (same as: node --env-file=.env scripts/github.mjs)
import { mkdir, writeFile } from 'node:fs/promises';
import { PROFILE } from '../src/content.js';
import { fetchCalendar } from '../src/lib/githubCalendar.js';

const token = process.env.PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('No token. Put PUBLIC_GITHUB_TOKEN=... in .env (see .env.example).');
  process.exit(1);
}

const out = await fetchCalendar(token, PROFILE.github).catch(err => {
  console.error(err.message);
  process.exit(1);
});
await mkdir('public/data', { recursive: true });
await writeFile('public/data/github.json', JSON.stringify(out));
console.log('Wrote public/data/github.json', out.total);
