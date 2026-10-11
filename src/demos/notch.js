// Aperçu interactif d'OsaNotch, utilisé sur l'accueil et sur l'étude de cas.
// Tout est dimensionné en unités de conteneur (cqw) : le même composant tient
// dans le petit écran du MacBook de l'accueil comme dans la grande démo.
import './notch.css'

const LYRICS = [
  "Je code jusqu'à pas d'heure",
  "L'encoche danse avec moi",
  'Un petit fantôme crème',
  'Qui suit mon curseur du doigt',
  'Et quand le build est vert',
  'Il me fait coucou tout bas',
]
const FILES = [
  { name: 'maquette.png', icon: '🖼️', c: 'linear-gradient(135deg,#fde68a,#f472b6)' },
  { name: 'rapport.pdf', icon: '📄', c: 'linear-gradient(#fff 62%,#ef4444 62%)' },
  { name: 'beat-v2.mp3', icon: '🎵', c: 'linear-gradient(135deg,#34d399,#3b82f6)' },
]
const STATES = ['music', 'shelf', 'dash', 'ai']
const TABS = { dash: ['⌂', 'Accueil'], music: ['♪', 'Musique'], shelf: ['▤', 'Étagère'], ai: ['✦', 'IA'] }
const TOUR = [
  { do: 'live', text: 'Replié : la pochette et l\'égaliseur se collent aux bords de l\'encoche', ms: 3200 },
  { do: 'music', text: 'Au survol : paroles synchronisées ligne par ligne', ms: 4600 },
  { do: 'hud', text: 'Le volume s\'affiche sous l\'encoche, à sa largeur exacte', ms: 2600 },
  { do: 'shelf', text: 'On glisse un fichier sur l\'encoche, il attend sur l\'étagère', ms: 4200 },
  { do: 'dash', text: 'Le tableau de bord : agenda, batterie, presse-papier', ms: 4400 },
  { do: 'ai', text: "Une IA a fini de générer ? Le notch te prévient", ms: 5600 },
]

const mascot = cls => `<span class="mascot ${cls}" data-mascot><i class="eye"><i></i></i><i class="eye"><i></i></i></span>`

export default function notch(root, { sound, updateEyes = () => {} }, opts = {}) {
  const { controls = true, tour = true } = opts
  const now = new Date()
  const fmtClock = () => new Date().toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '')
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7

  root.innerHTML = `
    <div class="nd">
      <div class="nd-screen">
        <div class="nd-wall" aria-hidden="true"></div>
        <div class="nd-menubar" aria-hidden="true">
          <span class="nd-apple"></span><b>Finder</b><span>Fichier</span><span>Édition</span><span class="nd-hide">Présentation</span>
          <span class="nd-r"><i class="nd-wifi"></i><i class="nd-batt"></i><span class="nd-clock">${fmtClock()}</span></span>
        </div>
        <div class="nd-island" data-state="music" tabindex="0" role="group" aria-label="Encoche OsaNotch : survole ou clique pour l'ouvrir">
          <div class="nd-live">
            <span class="nd-live-art"></span>
            <span class="nd-live-mid"><i class="nd-live-done">✓ Terminé</i></span>
            <span class="nd-live-eq"><i></i><i></i><i></i><i></i></span>
          </div>
          <div class="nd-open">
            <div class="nd-head">
              <nav class="nd-tabs">${['dash', 'music', 'shelf', 'ai'].map(t => `<button type="button" data-tab="${t}" title="${TABS[t][1]}"><span>${TABS[t][0]}</span><em>${TABS[t][1]}</em></button>`).join('')}</nav>
              <span class="nd-head-r">${mascot('nd-m-head')}<span class="nd-battface" title="Batterie : 82 %"><i></i><b>82</b></span></span>
            </div>
            <div class="nd-pane" data-pane="music">
              <div class="nd-art"><span class="nd-art-disc"></span><b>NB</b></div>
              <div class="nd-player">
                <p class="nd-track"><b>Nuit blanche</b><span>Démo OsaNotch</span></p>
                <div class="nd-lyrics"><div class="nd-lyrics-in">${LYRICS.map(l => `<p>${l}</p>`).join('')}</div></div>
                <div class="nd-prog"><span class="nd-t0">1:12</span><div class="nd-bar"><i></i></div><span>3:04</span></div>
                <div class="nd-ctrl"><button type="button" data-a="prev" aria-label="Précédent">⏮</button><button type="button" data-a="play" aria-label="Pause">⏸</button><button type="button" data-a="next" aria-label="Suivant">⏭</button></div>
              </div>
            </div>
            <div class="nd-pane" data-pane="shelf"><div class="nd-shelf"><p class="nd-empty">Glisse un fichier sur l'encoche</p></div></div>
            <div class="nd-pane" data-pane="dash">
              <div class="nd-cal">
                <p>${now.toLocaleString('fr-FR', { month: 'long' })}</p>
                <div class="nd-cal-g">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<b>${d}</b>`).join('')}${'<i></i>'.repeat(lead)}${Array.from({ length: days }, (_, i) => `<i class="${i + 1 === now.getDate() ? 'today' : ''}${[3, 9, 17, 24].includes(i + 1) ? ' ev' : ''}">${i + 1}</i>`).join('')}</div>
              </div>
              <div class="nd-dash-col">
                <div class="nd-card nd-next"><small>Prochain événement</small><b>Démo OsaLabs</b><span>aujourd'hui · 18:00</span></div>
                <div class="nd-card nd-clip"><small>Presse-papier</small><span>git push origin main</span><span>osadrop.osalabs.fr</span></div>
              </div>
              <div class="nd-card nd-batt-card"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16"/><circle class="p" cx="20" cy="20" r="16"/></svg><span class="nd-face">ᵔᴗᵔ</span><small>82 %</small></div>
            </div>
            <div class="nd-pane" data-pane="ai">
              <div class="nd-ai">
                ${mascot('nd-ai-m')}
                <div class="nd-ai-txt"><b>Aucune IA en cours</b><small>Lance une génération pour voir la détection.</small></div>
                <div class="nd-ticks" aria-hidden="true"><i></i><i></i><i></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="nd-hud" aria-hidden="true"><span>🔊</span><div><i></i></div></div>
        <div class="nd-drag" aria-hidden="true"></div>
        <div class="nd-dock" aria-hidden="true"><i style="--c:#60a5fa">◐</i><i style="--c:#f472b6">♫</i><i style="--c:#38bdf8">◎</i><i style="--c:#27272a">›_</i><i style="--c:#c4b5fd">●</i></div>
      </div>
      ${tour ? `<div class="nd-caption" aria-live="polite"><span class="nd-cap-dots">${TOUR.map(() => '<i></i>').join('')}</span><span class="nd-cap-text"></span><button type="button" class="nd-tour">Pause</button></div>` : ''}
      ${controls ? `<div class="nd-controls">
        <div class="nd-files"><p>Glisse sur l'encoche :</p>${FILES.map(f => `<button type="button" class="nd-file" data-name="${f.name}">${f.icon} ${f.name}</button>`).join('')}</div>
        <label class="nd-vol">Volume <input type="range" min="0" max="100" value="60" aria-label="Volume" /></label>
        <button type="button" class="nd-gen btn">Lancer une génération IA</button>
      </div>` : ''}
    </div>`

  const $ = s => root.querySelector(s)
  const $$ = s => [...root.querySelectorAll(s)]
  const nd = $('.nd'), island = $('.nd-island')
  let pinned = false

  const open = (silent) => { if (!island.classList.contains('open') && !silent) sound.click(1.15); island.classList.add('open'); requestAnimationFrame(updateEyes) }
  const close = () => { if (!pinned) island.classList.remove('open') }
  const setTab = t => {
    island.dataset.state = t
    $$('.nd-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t))
    requestAnimationFrame(updateEyes)
  }
  setTab('music')

  // l'utilisateur prend la main : la visite guidée se met en pause
  let userTimer
  const user = () => { stopTour(); clearTimeout(userTimer); userTimer = setTimeout(() => tour && startTour(), 15000) }
  island.addEventListener('pointerenter', () => { user(); open() })
  island.addEventListener('pointerleave', close)
  island.addEventListener('focus', () => { user(); open() })
  island.addEventListener('blur', () => { pinned = false; close() })
  island.addEventListener('click', e => { user(); if (!e.target.closest('button')) { pinned = !pinned; pinned ? open() : island.classList.remove('open') } })
  $$('.nd-tabs button').forEach(b => b.addEventListener('click', () => { sound.click(); setTab(b.dataset.tab) }))

  /* paroles */
  const lines = $$('.nd-lyrics p'), inner = $('.nd-lyrics-in')
  let li = 0, playing = true
  const showLine = () => {
    lines.forEach((p, i) => { p.classList.toggle('on', i === li); p.classList.toggle('past', i < li) })
    inner.style.transform = `translateY(${-Math.max(0, li - 1) * lines[0].offsetHeight}px)`
  }
  setInterval(() => { if (playing) { li = (li + 1) % lines.length; showLine() } }, 2100)
  requestAnimationFrame(showLine)
  $('[data-a="play"]').addEventListener('click', e => { playing = !playing; e.currentTarget.textContent = playing ? '⏸' : '▶'; nd.classList.toggle('paused', !playing); sound.click() })
  $$('[data-a="prev"], [data-a="next"]').forEach(b => b.addEventListener('click', () => { sound.click(); li = (li + (b.dataset.a === 'next' ? 1 : lines.length - 1)) % lines.length; showLine() }))

  /* étagère */
  const shelf = $('.nd-shelf')
  const addFile = (name, quiet) => {
    const f = FILES.find(x => x.name === name)
    $('.nd-empty')?.remove()
    if (![...shelf.children].some(el => el.dataset.name === name)) {
      const el = document.createElement('div')
      el.className = 'nd-shelf-file'
      el.dataset.name = name
      el.innerHTML = `<span style="background:${f.c}"></span><em>${name}</em>`
      shelf.appendChild(el)
    }
    open(true); setTab('shelf')
    if (!quiet) sound.chime()
  }
  // un fichier « fantôme » qui vole jusqu'à l'encoche (visite guidée)
  const flyFile = name => {
    const ghost = $('.nd-drag')
    ghost.textContent = FILES.find(f => f.name === name).icon + ' ' + name
    ghost.classList.remove('fly'); void ghost.offsetWidth; ghost.classList.add('fly')
    setTimeout(() => addFile(name, true), 1100)
  }
  $$('.nd-file').forEach(btn => btn.addEventListener('pointerdown', e => {
    e.preventDefault(); user()
    const ghost = btn.cloneNode(true)
    ghost.classList.add('nd-ghost')
    document.body.appendChild(ghost)
    let moved = false
    const move = ev => {
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'
      const r = island.getBoundingClientRect()
      island.classList.toggle('target', ev.clientX > r.left - 24 && ev.clientX < r.right + 24 && ev.clientY > r.top - 24 && ev.clientY < r.bottom + 40)
    }
    const mv = ev => { moved = true; move(ev) }
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); ghost.remove()
      const hit = island.classList.contains('target')
      island.classList.remove('target')
      if (hit || !moved) { pinned = true; addFile(btn.dataset.name) }
    }
    move(e)
    addEventListener('pointermove', mv); addEventListener('pointerup', up)
  }))

  /* HUD */
  const hud = $('.nd-hud'), hudBar = $('.nd-hud i')
  let hudT
  const showHud = v => {
    hudBar.style.width = v + '%'
    hud.classList.add('show')
    clearTimeout(hudT)
    hudT = setTimeout(() => hud.classList.remove('show'), 1300)
  }
  $('.nd-vol input')?.addEventListener('input', e => { user(); showHud(e.target.value) })

  /* IA : génération, puis 3 relevés sans activité avant de confirmer */
  const txt = $('.nd-ai-txt'), ticks = $$('.nd-ticks i'), aiM = $('.nd-ai-m')
  let generating = false
  const generate = quiet => {
    if (generating) return
    generating = true
    if (!quiet) sound.click()
    open(true); setTab('ai')
    aiM.classList.remove('happy'); island.classList.remove('done')
    ticks.forEach(t => t.className = '')
    txt.innerHTML = '<b>Assistant IA · génère…</b><small>Signal de génération détecté.</small>'
    nd.classList.add('busy')
    setTimeout(() => {
      txt.innerHTML = '<b>Plus de signal…</b><small>3 relevés de suite pour être sûr.</small>'
      ticks.forEach((t, i) => setTimeout(() => { t.className = 'on'; if (!quiet) sound.blip(660 + i * 120) }, (i + 1) * 700))
      setTimeout(() => {
        nd.classList.remove('busy')
        aiM.classList.add('happy')
        txt.innerHTML = "<b>L'assistant IA a terminé ✅</b><small>Validé après 3 relevés sans activité.</small>"
        if (!quiet) sound.chime()
        generating = false
        // en replié, l'île affiche une petite « activité en direct »
        setTimeout(() => { if (!pinned && !island.matches(':hover')) { island.classList.remove('open'); island.classList.add('done'); setTimeout(() => island.classList.remove('done'), 2600) } }, 1200)
      }, 3 * 700 + 300)
    }, 1800)
  }
  $('.nd-gen')?.addEventListener('click', () => { user(); pinned = true; generate(false) })

  /* horloge */
  setInterval(() => { $('.nd-clock').textContent = fmtClock() }, 20000)

  /* visite guidée */
  let step = -1, tourT = null, running = false
  const dots = $$('.nd-cap-dots i'), capText = $('.nd-cap-text'), tourBtn = $('.nd-tour')
  function runStep() {
    step = (step + 1) % TOUR.length
    const s = TOUR[step]
    dots.forEach((d, i) => d.classList.toggle('on', i === step))
    if (capText) { capText.textContent = s.text; capText.classList.remove('in'); void capText.offsetWidth; capText.classList.add('in') }
    pinned = false
    if (s.do === 'live') { island.classList.remove('open'); setTab('music') }
    if (s.do === 'music') { open(true); setTab('music') }
    if (s.do === 'hud') { island.classList.remove('open'); [35, 55, 75].forEach((v, i) => setTimeout(() => showHud(v), i * 420)) }
    if (s.do === 'shelf') { island.classList.remove('open'); flyFile(FILES[(step + shelf.children.length) % FILES.length].name) }
    if (s.do === 'dash') { open(true); setTab('dash') }
    if (s.do === 'ai') generate(true)
    tourT = setTimeout(runStep, s.ms)
  }
  function startTour() { if (running || !tour) return; running = true; nd.classList.add('touring'); if (tourBtn) tourBtn.textContent = 'Pause'; runStep() }
  function stopTour() { running = false; clearTimeout(tourT); nd.classList.remove('touring'); if (tourBtn) tourBtn.textContent = 'Visite guidée' }
  tourBtn?.addEventListener('click', () => { sound.click(); clearTimeout(userTimer); running ? stopTour() : startTour() })

  // la visite ne tourne que lorsque le composant est visible
  let visible = false
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting
    if (!visible) stopTour()
    else if (tour && !opts.waitForStart) startTour()
  }, { threshold: 0.45 }).observe(root)

  return {
    // l'accueil démarre la visite quand l'écran du MacBook a fini de s'ouvrir
    start() { opts.waitForStart = false; if (visible) startTour() },
  }
}
