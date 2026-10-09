// Régénère src/github-snapshot.json (données de secours si l'API GitHub ne répond pas).
// Usage : node scripts/github-snapshot.mjs
import { writeFileSync } from 'node:fs'
const USER = 'osayanis'
const j = url => fetch(url, { headers: { 'User-Agent': 'portfolio-snapshot' } }).then(r => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json() })
const [user, repos, events, contrib] = await Promise.all([
  j(`https://api.github.com/users/${USER}`),
  j(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
  j(`https://api.github.com/users/${USER}/events/public?per_page=30`),
  j(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`),
])
const snapshot = {
  generatedAt: new Date().toISOString(),
  user: (({ login, name, bio, location, avatar_url, html_url, public_repos, followers, following, created_at }) => ({ login, name, bio, location, avatar_url, html_url, public_repos, followers, following, created_at }))(user),
  repos: repos.map(r => ({ name: r.name, description: r.description, language: r.language, html_url: r.html_url, homepage: r.homepage, stargazers_count: r.stargazers_count, fork: r.fork, pushed_at: r.pushed_at })),
  events: events.slice(0, 12).map(e => ({ type: e.type, repo: e.repo.name, created_at: e.created_at, ref_type: e.payload?.ref_type })),
  contributions: contrib.contributions.map(c => [c.date, c.count, c.level]),
}
writeFileSync(new URL('../src/github-snapshot.json', import.meta.url), JSON.stringify(snapshot))
console.log('ok', snapshot.repos.length, 'repos,', snapshot.contributions.length, 'jours')
