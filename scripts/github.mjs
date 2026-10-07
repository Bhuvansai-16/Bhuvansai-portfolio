// Writes public/data/github.json (your contribution calendar) using your GitHub token.
// The token stays on your machine or CI; the site only ships the JSON it produces.
// Run: npm run github   (same as: node --env-file=.env scripts/github.mjs)
import { mkdir, writeFile } from 'node:fs/promises';

const USER = 'Bhuvansai-16';
const token = process.env.PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('No token. Put PUBLIC_GITHUB_TOKEN=... in .env (see .env.example).');
  process.exit(1);
}

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar {
    totalContributions weeks { contributionDays { date contributionCount contributionLevel } }
  } } }
}`;

// Same shape as the public fallback the page uses: { total: {year: n}, contributions: [{date, count, level}] }
const out = { total: {}, contributions: [] };
const year = new Date().getFullYear();
for (let y = 2023; y <= year; y++) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: USER, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` } }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors || !json.data?.user) {
    console.error(`GitHub API error for ${y}:`, json.errors?.[0]?.message || json.message || res.status);
    process.exit(1);
  }
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  out.total[y] = cal.totalContributions;
  for (const w of cal.weeks) for (const d of w.contributionDays) {
    out.contributions.push({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 });
  }
}

await mkdir('public/data', { recursive: true });
await writeFile('public/data/github.json', JSON.stringify(out));
console.log('Wrote public/data/github.json', out.total);
