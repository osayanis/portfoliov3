// Section GitHub : données en direct (API GitHub + graphe de contributions),
// avec un instantané embarqué si le réseau ou la limite d'API fait défaut.
import snapshot from './github-snapshot.json'

const USER = 'osayanis'
const CACHE_KEY = 'gh-cache-v1'
const CACHE_TTL = 15 * 60 * 1000
const HIDDEN_REPOS = new Set(['Yanis', 'osayanis1'])

const LANG_COLORS = {
  TypeScript: '#93c5fd',
  JavaScript: '#fde68a',
  Swift: '#fcc48b',
  Python: '#a5b4fc',
  Shell: '#a7e8bd',
  CSS: '#f3a6cf',
  HTML: '#f9a8a8',
}
const LEVELS = ['#ebe5d8', '#f9d3e6', '#f3a6cf', '#d877ab', '#c2337a']

const $ = (s, el = document) => el.querySelector(s)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
function ago(iso) {
  const s = (new Date(iso) - Date.now()) / 1000
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [u, sec] of units) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), u)
  return "à l'instant"
}
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

async function fetchLive() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.t < CACHE_TTL) return cached.data
  } catch {}

  const j = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
  const [user, repos, events, contrib] = await Promise.all([
    j(`https://api.github.com/users/${USER}`),
    j(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
    j(`https://api.github.com/users/${USER}/events/public?per_page=30`),
    j(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`),
  ])
  const data = {
    user,
    repos,
    events: events.map(e => ({ type: e.type, repo: e.repo.name, created_at: e.created_at, ref_type: e.payload?.ref_type })),
    contributions: contrib.contributions.map(c => [c.date, c.count, c.level]),
  }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })) } catch {}
  return data
}

/* ---------- calculs ---------- */
function contribStats(days) {
  let total = 0, active = 0, longest = 0, run = 0, best = days[0]
  for (const d of days) {
    total += d[1]
    if (d[1] > 0) { active++; run++; longest = Math.max(longest, run) } else run = 0
    if (d[1] > best[1]) best = d
  }
  // série en cours : on tolère un jour vide aujourd'hui (la journée n'est pas finie)
  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i][1] > 0) current++
    else if (i === days.length - 1) continue
    else break
  }
  return { total, active, longest, current, best }
}

function languages(repos) {
  const counts = {}
  repos.filter(r => !r.fork && r.language).forEach(r => { counts[r.language] = (counts[r.language] || 0) + 1 })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n, pct: (n / total) * 100 }))
}

function groupEvents(events) {
  const out = []
  for (const e of events) {
    if (!['PushEvent', 'CreateEvent', 'PublicEvent', 'ReleaseEvent', 'WatchEvent', 'ForkEvent'].includes(e.type)) continue
    const last = out[out.length - 1]
    if (last && last.type === e.type && last.repo === e.repo && e.type === 'PushEvent') { last.n++; continue }
    out.push({ ...e, n: 1 })
  }
  return out.slice(0, 6)
}

function eventText(e) {
  const repo = e.repo.split('/')[1]
  const link = `<a href="https://github.com/${esc(e.repo)}" target="_blank" rel="noopener">${esc(repo)}</a>`
  switch (e.type) {
    case 'PushEvent': return e.n > 1 ? `${e.n} pushs sur ${link}` : `Push sur ${link}`
    case 'CreateEvent': return e.ref_type === 'repository' ? `Nouveau dépôt ${link}` : `Nouvelle ${e.ref_type === 'tag' ? 'version' : 'branche'} sur ${link}`
    case 'PublicEvent': return `${link} passe en public`
    case 'ReleaseEvent': return `Nouvelle release de ${link}`
    case 'WatchEvent': return `Étoile sur ${link}`
    case 'ForkEvent': return `Fork de ${link}`
  }
  return link
}
const eventIcon = { PushEvent: '↑', CreateEvent: '+', PublicEvent: '◉', ReleaseEvent: '★', WatchEvent: '☆', ForkEvent: '⑂' }

/* ---------- rendu ---------- */
function renderGraph(days) {
  // colonnes = semaines (dimanche → samedi), comme sur GitHub
  const first = new Date(days[0][0] + 'T12:00:00').getDay()
  const cells = Array(first).fill(null).concat(days)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  let lastMonth = -1
  const months = weeks.map(w => {
    const d = w.find(Boolean)
    const m = new Date(d[0] + 'T12:00:00').getMonth()
    if (m === lastMonth) return ''
    lastMonth = m
    return new Date(d[0] + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
  })

  return `
    <div class="gh-months" aria-hidden="true">${months.map(m => `<span>${m}</span>`).join('')}</div>
    <div class="gh-weeks">
      ${weeks.map((w, wi) => `<div class="gh-week" style="--w:${wi}">${w.map(d => d
        ? `<i style="background:${LEVELS[d[2]]}" title="${d[1]} contribution${d[1] > 1 ? 's' : ''} le ${fmtDate(d[0])}"></i>`
        : '<i class="empty"></i>').join('')}</div>`).join('')}
    </div>`
}

function render(data, live) {
  const root = $('#gh')
  const { user } = data
  const days = data.contributions
  const st = contribStats(days)
  const langs = languages(data.repos)
  const repos = data.repos
    .filter(r => !r.fork && !HIDDEN_REPOS.has(r.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 6)
  const events = groupEvents(data.events)

  root.innerHTML = `
    <div class="gh-top">
      <a class="gh-profile" href="${esc(user.html_url)}" target="_blank" rel="noopener">
        <span class="gh-avatar"><img src="${esc(user.avatar_url)}&s=160" alt="" width="80" height="80" loading="lazy"></span>
        <span class="gh-id">
          <b>${esc(user.name || user.login)}</b>
          <span>@${esc(user.login)} · ${esc(user.location || '')}</span>
        </span>
        <span class="gh-follow">Suivre ↗</span>
      </a>
      <span class="gh-status ${live ? 'is-live' : ''}">${live ? 'En direct' : `Instantané du ${new Date(snapshot.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}</span>
    </div>

    <div class="gh-stats">
      <div><b>${st.total}</b><span>contributions sur 12 mois</span></div>
      <div><b>${st.current}</b><span>jour${st.current > 1 ? 's' : ''} d'affilée en ce moment</span></div>
      <div><b>${st.best[1]}</b><span>contributions le ${fmtDate(st.best[0])}, mon record</span></div>
      <div><b>${user.public_repos}</b><span>dépôts publics</span></div>
    </div>

    <div class="gh-card gh-graph-card">
      <div class="gh-card-head">
        <h3>Contributions</h3>
        <span class="gh-legend" aria-hidden="true">moins ${LEVELS.map(c => `<i style="background:${c}"></i>`).join('')} plus</span>
      </div>
      <div class="gh-graph" tabindex="0" aria-label="${st.total} contributions sur les 12 derniers mois, ${st.active} jours actifs">${renderGraph(days)}</div>
    </div>

    <div class="gh-split">
      <div class="gh-card">
        <div class="gh-card-head"><h3>Derniers dépôts</h3><a href="${esc(user.html_url)}?tab=repositories" target="_blank" rel="noopener">Tout voir ↗</a></div>
        <ul class="gh-repos">
          ${repos.map(r => `
            <li><a href="${esc(r.html_url)}" target="_blank" rel="noopener">
              <span class="gh-repo-name">${esc(r.name)}</span>
              <span class="gh-repo-desc">${esc(r.description || 'Pas encore de description')}</span>
              <span class="gh-repo-meta">
                ${r.language ? `<span><i style="background:${LANG_COLORS[r.language] || '#e5e7eb'}"></i>${esc(r.language)}</span>` : ''}
                <span>mis à jour ${ago(r.pushed_at)}</span>
              </span>
            </a></li>`).join('')}
        </ul>
      </div>

      <div class="gh-side">
        <div class="gh-card">
          <div class="gh-card-head"><h3>Langages</h3></div>
          <div class="gh-langbar">${langs.map(l => `<span style="width:${l.pct}%;background:${LANG_COLORS[l.name] || '#e5e7eb'}" title="${esc(l.name)}"></span>`).join('')}</div>
          <ul class="gh-langs">${langs.map(l => `<li><i style="background:${LANG_COLORS[l.name] || '#e5e7eb'}"></i>${esc(l.name)}<b>${l.n}</b></li>`).join('')}</ul>
        </div>
        <div class="gh-card">
          <div class="gh-card-head"><h3>Activité récente</h3></div>
          <ul class="gh-feed">
            ${events.map(e => `<li><span class="gh-ev-icon" aria-hidden="true">${eventIcon[e.type] || '•'}</span><span>${eventText(e)}</span><time datetime="${e.created_at}">${ago(e.created_at)}</time></li>`).join('') || '<li>Rien de public ces derniers jours.</li>'}
          </ul>
        </div>
      </div>
    </div>`

  // le graphe défile jusqu'aux semaines les plus récentes sur petit écran
  const g = $('.gh-graph', root)
  g.scrollLeft = g.scrollWidth
}

export function initGithub() {
  const root = $('#gh')
  if (!root) return
  render(snapshot, false)
  const section = root.closest('section')
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return
    io.disconnect()
    // on attend un peu les données live pour n'animer le graphe qu'une seule fois
    const live = fetchLive()
    const timeout = new Promise(r => setTimeout(r, 1500))
    Promise.race([live.then(d => render(d, true)), timeout]).catch(() => {}).finally(() => {
      section.classList.add('gh-in')
      setTimeout(() => section.classList.add('gh-done'), 1400)
      live.then(d => { if (!root.querySelector('.gh-status.is-live')) render(d, true) }).catch(() => {})
    })
  }, { rootMargin: '300px' })
  io.observe(section)
}
