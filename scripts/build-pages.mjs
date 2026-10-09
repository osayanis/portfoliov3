// Génère une page HTML statique par projet : projets/<slug>/index.html
// Usage : node scripts/build-pages.mjs (lancé automatiquement par npm run dev / build)
import { mkdirSync, writeFileSync } from 'node:fs'
import { projects } from '../src/projects.js'

const SITE = 'https://yanis.pro'
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = s => String(s).replace(/<[^>]+>/g, '')

/* ---------- schéma d'architecture en SVG ---------- */
function clip(a, b) {
  // point où la droite a→b sort du rectangle a
  const dx = b.x - a.x, dy = b.y - a.y
  const t = Math.min(a.w / 2 / Math.abs(dx || 1e-6), a.h / 2 / Math.abs(dy || 1e-6))
  return { x: a.x + dx * t, y: a.y + dy * t }
}
function diagram(d, name) {
  const byId = Object.fromEntries(d.nodes.map(n => [n.id, n]))
  const edges = d.edges.map((e, i) => {
    const a = byId[e.from], b = byId[e.to]
    const p1 = clip(a, b), p2 = clip(b, a)
    // on recule un peu pour laisser respirer les flèches
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
    const ux = (p2.x - p1.x) / len, uy = (p2.y - p1.y) / len
    const s = { x: p1.x + ux * 8, y: p1.y + uy * 8 }, t = { x: p2.x - ux * 8, y: p2.y - uy * 8 }
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2
    const cls = ['d-edge', e.dashed && 'dashed', e.thick && 'thick'].filter(Boolean).join(' ')
    const label = e.label
      ? `<g class="d-elabel" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><rect x="${-(e.label.length * 3.6 + 10)}" y="-11" width="${e.label.length * 7.2 + 20}" height="22" rx="11"/><text text-anchor="middle" dy="4">${esc(e.label)}</text></g>`
      : ''
    return `<path class="${cls}" style="--i:${i}" d="M${s.x.toFixed(1)} ${s.y.toFixed(1)} L${t.x.toFixed(1)} ${t.y.toFixed(1)}" marker-end="url(#arr)"${e.both ? ' marker-start="url(#arr-s)"' : ''}/>${label}`
  }).join('')
  const nodes = d.nodes.map((n, i) => {
    const x = n.x - n.w / 2, y = n.y - n.h / 2
    return `<g class="d-node" style="--i:${i};--c:${n.c}">
      <rect class="d-shadow" x="${x}" y="${y + 5}" width="${n.w}" height="${n.h}" rx="14"/>
      <rect class="d-box" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="14"/>
      <text class="d-label" x="${n.x}" y="${n.y + (n.sub ? -3 : 6)}" text-anchor="middle">${esc(n.label)}</text>
      ${n.sub ? `<text class="d-sub" x="${n.x}" y="${n.y + 16}" text-anchor="middle">${esc(n.sub)}</text>` : ''}
    </g>`
  }).join('')
  return `<svg class="diagram" viewBox="0 0 ${d.w} ${d.h}" role="img" aria-label="Schéma d'architecture de ${esc(name)}">
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="d-arrow"/></marker>
      <marker id="arr-s" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="d-arrow"/></marker>
    </defs>
    <g class="d-edges">${edges}</g>${nodes}
  </svg>`
}

/* ---------- visuels ---------- */
function visual(v) {
  const img = `<img src="${v.src}" alt="${esc(v.alt)}" loading="lazy" decoding="async">`
  let frame
  if (v.type === 'browser') frame = `<div class="frame-browser"><div class="fb-bar"><i></i><i></i><i></i><span>${esc(v.url)}</span></div>${img}</div>`
  else if (v.type === 'phone') frame = `<div class="frame-phone"><span class="fp-notch"></span>${img}</div>`
  else if (v.type === 'shot') frame = `<button type="button" class="frame-shot" data-zoom="${v.src}" aria-label="Agrandir : ${esc(v.alt)}">${img}</button>`
  else frame = `<div class="frame-image${v.dark ? ' dark' : ''}">${img}</div>`
  return `<figure class="vis vis-${v.type}${v.wide ? ' wide' : ''} reveal">${frame}<figcaption>${esc(v.caption)}</figcaption></figure>`
}

/* ---------- page ---------- */
function page(p, i) {
  const prev = projects[(i - 1 + projects.length) % projects.length]
  const next = projects[(i + 1) % projects.length]
  const desc = strip(p.summary).slice(0, 155)
  const title = `${p.name} · Étude de cas · Yanis`

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="theme-color" content="${p.soft}" />
    <link rel="canonical" href="${SITE}/projets/${p.slug}/" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(p.name)} · ${esc(strip(p.tagline))}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${SITE}/projets/${p.slug}/" />
    ${p.visuals[0] ? `<meta property="og:image" content="${SITE}${p.visuals[0].src}" />` : ''}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  </head>
  <body class="cs-page" style="--p:${p.color};--p-deep:${p.deep};--p-soft:${p.soft}">
    <a class="skip" href="#main">Aller au contenu</a>

    <header class="nav">
      <a class="logo" href="/" aria-label="Retour à l'accueil">yanis<span>.</span></a>
      <nav class="nav-links" aria-label="Navigation principale">
        <a href="/#notch">Projets</a>
        <a href="/#labo">Labo</a>
        <a href="/#apropos">À propos</a>
        <a href="/#github">GitHub</a>
        <button class="sound-toggle" type="button" aria-pressed="true" title="Activer / couper le son">
          <span class="sound-on">Son</span><span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        <a class="nav-cta" href="/#contact">On se parle ?</a>
      </nav>
    </header>

    <main id="main" class="cs">
      <!-- HERO -->
      <section class="cs-hero">
        <a class="cs-back" href="/#notch"><span aria-hidden="true">←</span> Tous les projets</a>
        <div class="cs-hero-grid">
          <div class="cs-hero-copy">
            <p class="eyebrow"><span class="dot" style="--c:${p.color}"></span>${esc(p.kicker)}</p>
            <h1 class="cs-title"><span>${esc(p.name)}</span></h1>
            <p class="cs-tagline">${p.tagline}</p>
            <p class="lead">${p.summary}</p>
            ${p.links.length ? `<div class="btn-row">${p.links.map(l => `<a class="btn${l.primary ? ' btn-dark' : ''}" href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>` : '<p class="cs-private">Dépôt privé pour l\'instant. La feuille de route est détaillée plus bas.</p>'}
          </div>
          <div class="cs-cap" aria-hidden="true">
            <button type="button" class="cs-key" tabindex="-1"><span class="cs-key-top"><b>${esc(p.letter)}</b><small>${esc(p.name)}</small></span></button>
          </div>
        </div>
        <dl class="cs-meta">
          <div><dt>Rôle</dt><dd>${esc(p.meta.role)}</dd></div>
          <div><dt>Période</dt><dd>${esc(p.meta.period)}</dd></div>
          <div><dt>Statut</dt><dd>${esc(p.meta.status)}</dd></div>
          <div class="cs-meta-stack"><dt>Stack</dt><dd>${p.stack.map(s => `<span>${esc(s)}</span>`).join('')}</dd></div>
        </dl>
      </section>

      <!-- CHIFFRES -->
      <section class="cs-stats" aria-label="En chiffres">
        ${p.stats.map((s, k) => `<div class="cs-stat reveal" style="--d:${k * 0.07}s"><b>${esc(s.n)}</b><span>${esc(s.label)}</span></div>`).join('')}
      </section>

      <!-- POINT DE DÉPART -->
      <section class="cs-section cs-problem">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">01</span>Le point de départ</p></div>
        <div class="cs-problem-grid">
          <blockquote class="reveal"><p>« ${esc(p.problem.quote)} »</p></blockquote>
          <div class="cs-prose reveal">${p.problem.text.map(t => `<p>${t}</p>`).join('')}</div>
        </div>
      </section>

      ${p.visuals.length ? `<!-- VISUELS -->
      <section class="cs-section cs-visuals">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">02</span>En images</p><h2>À quoi ça <em>ressemble.</em></h2></div>
        <div class="vis-grid vis-grid-${p.visuals.some(v => v.type === 'shot') ? 'shots' : 'mixed'}">${p.visuals.map(visual).join('')}</div>
      </section>` : ''}

      <!-- FONCTIONNEMENT -->
      <section class="cs-section cs-how">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">${p.visuals.length ? '03' : '02'}</span>Comment ça marche</p><h2>Sous le <em>capot.</em></h2><p class="lead narrow">${p.how.intro}</p></div>
        <div class="diagram-card reveal">${diagram(p.how.diagram, p.name)}</div>
        <ol class="cs-steps">
          ${p.how.steps.map((s, k) => `<li class="reveal" style="--d:${k * 0.06}s"><span class="step-key" aria-hidden="true">${k + 1}</span><div><h3>${s.t}</h3><p>${s.d}</p></div></li>`).join('')}
        </ol>
      </section>

      <!-- DÉMO -->
      <section class="cs-section cs-demo">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">✦</span>À toi de jouer</p><h2>${esc(p.demo.title)}</h2><p class="lead narrow">${esc(p.demo.intro)}</p></div>
        <div class="demo reveal" data-demo="${p.demo.kind}"><noscript>Cette démo a besoin de JavaScript.</noscript></div>
      </section>

      <!-- DÉFIS -->
      <section class="cs-section cs-challenges">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">!</span>Les défis</p><h2>Ce qui a <em>résisté.</em></h2></div>
        <div class="challenge-grid">
          ${p.challenges.map((c, k) => `<article class="challenge reveal" style="--d:${k * 0.06}s">
            <h3>${c.title}</h3>
            <p class="ch-problem"><span class="ch-tag bad">Problème</span>${c.problem}</p>
            <p class="ch-solution"><span class="ch-tag good">Solution</span>${c.solution}</p>
          </article>`).join('')}
        </div>
      </section>

      <!-- JOURNAL -->
      <section class="cs-section cs-journal">
        <div class="cs-head reveal"><p class="eyebrow"><span class="num">⏱</span>Journal de bord</p><h2>Comment c'est <em>arrivé.</em></h2></div>
        <ol class="journal">
          ${p.journal.map(j => `<li class="reveal${j.now ? ' now' : ''}"><time>${esc(j.d)}</time><span class="j-dot" aria-hidden="true"></span><div><h3>${esc(j.t)}</h3><p>${esc(j.x)}</p></div></li>`).join('')}
        </ol>
      </section>

      <!-- ET ENSUITE -->
      <section class="cs-section cs-next">
        <div class="cs-next-card reveal">
          <div>
            <p class="eyebrow"><span class="num">→</span>Et ensuite</p>
            <h2>La suite <em>du projet.</em></h2>
            ${p.credits ? `<p class="cs-credits">${p.credits}</p>` : ''}
          </div>
          <ul>${p.next.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
        </div>
      </section>

      <!-- NAVIGATION -->
      <nav class="cs-pager" aria-label="Autres projets">
        <a class="pager-key prev" href="/projets/${prev.slug}/" style="--c:${prev.color}" data-key="ArrowLeft">
          <span class="pager-top"><small>← Projet précédent</small><b>${esc(prev.name)}</b></span>
        </a>
        <a class="pager-key next" href="/projets/${next.slug}/" style="--c:${next.color}" data-key="ArrowRight">
          <span class="pager-top"><small>Projet suivant →</small><b>${esc(next.name)}</b></span>
        </a>
      </nav>
      <p class="pager-hint">Astuce : les flèches <kbd>←</kbd> <kbd>→</kbd> de ton clavier passent d'un projet à l'autre.</p>
    </main>

    <footer class="footer">
      <p>Fait main par Yanis. <a href="/">Retour à l'accueil</a></p>
      <p class="muted">${esc(p.name)} · étude de cas</p>
    </footer>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <canvas class="confetti" id="confetti" aria-hidden="true"></canvas>
    <dialog class="zoom" id="zoom"><img alt="" /><button type="button" aria-label="Fermer">✕</button></dialog>

    <script type="module" src="/src/project.js"></script>
  </body>
</html>
`
}

projects.forEach((p, i) => {
  mkdirSync(new URL(`../projets/${p.slug}/`, import.meta.url), { recursive: true })
  writeFileSync(new URL(`../projets/${p.slug}/index.html`, import.meta.url), page(p, i))
})
console.log(`${projects.length} pages projet générées`)
