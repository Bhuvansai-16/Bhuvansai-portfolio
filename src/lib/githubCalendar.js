// The contribution calendar from GitHub's GraphQL API, with a token (so private contributions count too).
// Server-side only: used by api/github.ts and scripts/github.mjs, never shipped to the browser.
// Shape: { total: {year: n}, contributions: [{date, count, level}] }, the same as the public fallback the page uses.
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar {
    totalContributions weeks { contributionDays { date contributionCount contributionLevel } }
  } } }
}`;

export async function fetchCalendar(token, login, fromYear = 2023) {
  const years = Array.from({ length: new Date().getUTCFullYear() - fromYear + 1 }, (_, i) => fromYear + i);
  const cals = await Promise.all(years.map(async y => {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { login, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` } }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.errors || !json.data?.user) throw new Error(`GitHub API error for ${y}: ${json.errors?.[0]?.message || json.message || res.status}`);
    return json.data.user.contributionsCollection.contributionCalendar;
  }));
  /** @type {{ total: Record<number, number>, contributions: { date: string, count: number, level: number }[] }} */
  const out = { total: {}, contributions: [] };
  cals.forEach((cal, i) => {
    out.total[years[i]] = cal.totalContributions;
    for (const w of cal.weeks) for (const d of w.contributionDays) out.contributions.push({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 });
  });
  return out;
}
