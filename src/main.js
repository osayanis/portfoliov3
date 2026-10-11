// Accueil : le bureau de Yanis. On explore la pièce en 3D, chaque objet ouvre un chapitre.
import './style.css'
import './room/room.css'
import { $, $$, sound, toast, confetti, updateEyes } from './core.js'
import { profile, osalabsApps, stack } from './data.js'
import { chapters, byId } from './room/chapters.js'
import snapshot from './github-snapshot.json'
import { RECORDS } from './room/records.js'

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const order = chapters.map(c => c.id)
// liens directs : /#osanotch, /#github… ouvrent l'objet correspondant
const ALIASES = { osanotch: 'macbook', clavio: 'piano', openpod: 'openpod', proxmox: 'server', osaparty: 'neon', osadrop: 'neon', osacast: 'neon', osaboard: 'neon', osalabs: 'neon', github: 'calendar', contact: 'phone', apropos: 'frame', methode: 'keyboard', stack: 'keyboard', debuts: 'crt', lycee: 'notebook' }

/* ================= progression ================= */
let found = new Set()
try { found = new Set(JSON.parse(localStorage.getItem('room-found') || '[]')) } catch {}
const dots = $('.hud-dots')
dots.innerHTML = order.map(id => `<i data-id="${id}" style="--c:${byId[id].color}"></i>`).join('')
function discover(id) {
  const fresh = !found.has(id)
  found.add(id)
  try { localStorage.setItem('room-found', JSON.stringify([...found])) } catch {}
  $('.hud-count b').textContent = found.size
  $$('.hud-dots i').forEach(d => d.classList.toggle('on', found.has(d.dataset.id)))
  $$('.carnet-list li').forEach(li => li.classList.toggle('found', found.has(li.dataset.id)))
  if (fresh && found.size === order.length) {
    setTimeout(() => { sound.chime(); confetti(); toast('Tu as fait le tour du bureau ! Merci d\'être passé 🎉') }, 600)
  }
}
$('.hud-count b').textContent = found.size
$$('.hud-dots i').forEach(d => d.classList.toggle('on', found.has(d.dataset.id)))
$$('.carnet-list li').forEach(li => li.classList.toggle('found', found.has(li.dataset.id)))

/* ================= bulle de la mascotte ================= */
const bubble = $('.room-bubble')
let bubbleTimer
function say(text, actions = [], ms = 0) {
  clearTimeout(bubbleTimer)
  $('p', bubble).textContent = text
  const box = $('.bubble-actions', bubble)
  box.innerHTML = ''
  actions.forEach(([label, fn, primary]) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    if (primary) b.className = 'primary'
    b.addEventListener('click', () => { sound.click(); fn() })
    box.appendChild(b)
  })
  bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show')
  if (ms) bubbleTimer = setTimeout(hideBubble, ms)
}
const hideBubble = () => bubble.classList.remove('show')

/* ================= panneau de chapitre ================= */
const panel = $('.chapter'), body = $('.chapter-body')
let room = null, current = null, touring = false

const widgets = {
  apps: () => `<div class="ch-apps">${osalabsApps.map(a => `
    <a class="ch-app" href="${a.page}" style="--c:${a.color}">
      <b>${a.name}</b><span>${a.tag}</span><p>${a.desc}</p><em>Lire l'étude de cas →</em>
    </a>`).join('')}</div>`,
  notch: () => '<div class="ch-notch" data-widget="notch"></div>',
  github: () => '<section class="ch-gh"><div class="gh" id="gh"></div></section>',
  stack: () => `<p class="ch-sub">Ma boîte à outils</p><div class="keycaps in ch-stack">${stack.map((s, i) => `<button type="button" class="cap" style="--c:${s.c};--i:${i}"><span>${s.name}</span></button>`).join('')}</div>`,
  contact: () => `
    <a class="ch-call" href="${profile.email ? `mailto:${profile.email}` : profile.github}" ${profile.email ? '' : 'target="_blank" rel="noopener"'}><span>Écris-moi</span><b>↵</b></a>
    <ul class="ch-contact">
      <li><a href="${profile.linkedin}" target="_blank" rel="noopener"><span>LinkedIn</span><b>in/yansb</b></a></li>
      <li><a href="${profile.github}" target="_blank" rel="noopener"><span>GitHub</span><b>@osayanis</b></a></li>
      <li><a href="${profile.osalabs}" target="_blank" rel="noopener"><span>Labo</span><b>osalabs.fr</b></a></li>
      <li><button type="button" data-copy="${profile.discord}"><span>Discord</span><b>${profile.discord}</b><em>copier</em></button></li>
    </ul>`,
}

function renderChapter(c) {
  $('.chapter-era').textContent = c.era
  $('.chapter-era').style.setProperty('--c', c.color)
  $('.chapter-object').textContent = c.object
  body.innerHTML = `
    <p class="ch-say"><span class="ch-say-m" aria-hidden="true"><i></i><i></i></span><span>${c.say}</span></p>
    <h2>${c.title}</h2>
    <div class="ch-text">${c.body}</div>
    ${c.image ? `<figure class="ch-img"><img src="${c.image.src}" alt="${c.image.alt}" loading="lazy"></figure>` : ''}
    ${c.widget ? widgets[c.widget]() : ''}
    ${c.stats ? `<dl class="ch-stats">${c.stats.map(([n, l]) => `<div><dt>${n}</dt><dd>${l}</dd></div>`).join('')}</dl>` : ''}
    ${c.chips ? `<div class="ch-chips">${c.chips.map(x => `<span>${x}</span>`).join('')}</div>` : ''}
    ${c.links?.length ? `<div class="ch-links">${c.links.map(l => `<a class="ch-link${l.primary ? ' primary' : ''}" href="${l.url}"${l.url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${l.label}${l.url.startsWith('http') ? ' ↗' : ' →'}</a>`).join('')}</div>` : ''}`
  body.scrollTop = 0
  const i = order.indexOf(c.id)
  const prev = byId[order[(i - 1 + order.length) % order.length]], next = byId[order[(i + 1) % order.length]]
  $('.chapter-nav[data-dir="-1"] span').textContent = prev.object
  $('.chapter-nav[data-dir="1"] span').textContent = next.object
  $('.chapter-step').textContent = `${i + 1} / ${order.length}`

  // widgets vivants
  if (c.widget === 'notch') import('./demos/notch.js').then(m => m.default($('[data-widget="notch"]', body), { sound, updateEyes }, { controls: false, tour: true }))
  if (c.widget === 'github') import('./github.js').then(m => m.initGithub())
  $$('.cap', body).forEach((b, k) => b.addEventListener('pointerdown', () => sound.click(0.85 + (k % 6) * 0.06)))
  $$('[data-copy]', body).forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast(`Pseudo Discord copié : ${b.dataset.copy}`) } catch { toast(`Mon Discord : ${b.dataset.copy}`) }
    sound.click()
  }))
  $$('.method-list kbd', body).forEach(k => k.addEventListener('pointerdown', () => { sound.click(0.9); k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 140) }))
}

function openChapter(id, { fromTour = false } = {}) {
  const c = byId[id]
  if (!c) return
  if (deckOpen) closeDeck()
  if (shelfOpen) closeShelf()
  if (!fromTour) touring = false
  current = id
  renderChapter(c)
  panel.hidden = false
  requestAnimationFrame(() => panel.classList.add('open'))
  document.body.classList.add('reading')
  room?.focus(id)
  if (room) room.panelOpen = true
  discover(id)
  if (innerWidth >= 760) say(c.say, [], 9000)
  else hideBubble()
  history.replaceState(null, '', `#${id}`)
  tag.classList.remove('show')
}
function closeChapter() {
  if (!current) return
  current = null
  touring = false
  panel.classList.remove('open')
  document.body.classList.remove('reading')
  setTimeout(() => { if (!current) panel.hidden = true }, 450)
  if (room) { room.panelOpen = false; room.unfocus() }
  hideBubble()
  history.replaceState(null, '', location.pathname)
}
function step(dir) {
  const i = current ? order.indexOf(current) : -1
  openChapter(order[(i + dir + order.length) % order.length], { fromTour: touring })
}
$('.chapter-close').addEventListener('click', closeChapter)
$$('.chapter-nav').forEach(b => b.addEventListener('click', () => step(+b.dataset.dir)))

/* ================= visite guidée & carnet ================= */
function startTour() {
  closeCarnet()
  touring = true
  const first = order.find(id => !found.has(id)) || order[0]
  openChapter(first, { fromTour: true })
}
const carnet = $('.carnet')
function openCarnet() { carnet.classList.add('open'); document.body.classList.add('carnet-open'); sound.click() }
function closeCarnet() { carnet.classList.remove('open'); document.body.classList.remove('carnet-open') }
$('[data-action="tour"]').addEventListener('click', () => { sound.click(); startTour() })
$('[data-action="carnet"]').addEventListener('click', () => carnet.classList.contains('open') ? closeCarnet() : openCarnet())
$('.carnet-close').addEventListener('click', closeCarnet)
$$('.carnet-list li').forEach(li => li.addEventListener('click', e => {
  if (e.target.closest('a')) return
  closeCarnet()
  openChapter(li.dataset.id)
}))


/* ================= le tourne-disque et la discothèque ================= */
// L'extrait officiel de 30 s fourni par Apple (API iTunes) : aucun fichier audio hébergé,
// et un lien vers Apple Music pour écouter le morceau en entier. Pas de paroles affichées
// (elles sont protégées) : à la place, des infos sur le morceau flottent à côté du disque.
let cur = 0, tracks = null, audio = null, playing = false, deckOpen = false
const deck = document.createElement('aside')
deck.className = 'deck'
deck.setAttribute('aria-label', 'Platine')
deck.innerHTML = `
  <div class="deck-card">
    <img class="deck-cover" alt="" />
    <div class="deck-meta"><small>Sur la platine</small><b></b><span></span></div>
    <div class="deck-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="deck-progress"><i></i></div>
    <div class="deck-actions">
      <button type="button" class="deck-play">Lecture</button>
      <a class="deck-apple" target="_blank" rel="noopener">Écouter en entier ↗</a>
    </div>
    <button type="button" class="deck-swap">Changer de disque</button>
    <p class="deck-credit">Extrait de 30 s fourni par Apple Music</p>
    <button type="button" class="deck-close" aria-label="Revenir au bureau">✕</button>
  </div>
  <ul class="deck-facts" aria-hidden="true"></ul>
  <button type="button" class="deck-mini" aria-label="Revenir à la platine"><span class="deck-mini-disc"></span><span class="deck-mini-name"></span></button>`
document.body.appendChild(deck)

// la carte du disque sorti de la discothèque
const crateCard = document.createElement('aside')
crateCard.className = 'deck crate'
crateCard.setAttribute('aria-label', 'Discothèque')
crateCard.innerHTML = `
  <div class="deck-card">
    <img class="deck-cover" alt="" />
    <div class="deck-meta"><small>Dans la discothèque</small><b></b><span></span></div>
    <div class="deck-actions">
      <button type="button" class="deck-play crate-put">Poser sur la platine</button>
      <button type="button" class="deck-apple crate-back">Le ranger</button>
    </div>
    <button type="button" class="deck-close" aria-label="Ranger le disque">✕</button>
  </div>`
document.body.appendChild(crateCard)
const shelfHint = document.createElement('p')
shelfHint.className = 'shelf-hint'
shelfHint.textContent = 'Choisis un vinyle'
document.body.appendChild(shelfHint)

const artOf = i => tracks?.[i]?.artworkUrl100?.replace('100x100bb', '600x600bb') || ''
// une seule requête pour tous les disques, puis les pochettes arrivent dans la scène
let tracksLoading = null
function loadTracks() {
  if (tracksLoading) return tracksLoading
  tracksLoading = fetch(`https://itunes.apple.com/lookup?id=${RECORDS.map(r => r.id).join(',')}&country=fr`)
    .then(r => r.json())
    .then(j => {
      tracks = RECORDS.map(r => j.results.find(t => t.trackId === r.id && t.previewUrl) || null)
      RECORDS.forEach((r, i) => { if (artOf(i)) room?.setRecordArt(i, artOf(i)) })
      renderDeck()
      return tracks
    })
    .catch(() => { tracksLoading = null; return null })
  return tracksLoading
}
function renderDeck() {
  const r = RECORDS[cur]
  $('.deck-meta b', deck).textContent = r.title
  $('.deck-meta span', deck).textContent = `${r.artist} · ${r.album} · ${r.year}`
  $('.deck-mini-name', deck).textContent = r.artist
  $('.deck-facts', deck).innerHTML = r.facts.map((f, i) => `<li style="--i:${i}">${f}</li>`).join('')
  const art = artOf(cur)
  if (art) $('.deck-cover', deck).src = art
  if (tracks?.[cur]) $('.deck-apple', deck).href = tracks[cur].trackViewUrl
}
function setPlaying(p) {
  playing = p
  room?.setMusic(p)
  deck.classList.toggle('playing', p)
  $('.deck-play', deck).textContent = p ? 'Pause' : 'Lecture'
}
async function playMusic() {
  await loadTracks()
  const t = tracks?.[cur]
  if (!t) { say('La platine ne trouve pas le disque… réessaie plus tard.', [], 3500); return }
  if (!audio || audio.dataset.id !== String(t.trackId)) {
    audio?.pause()
    audio = new Audio(t.previewUrl)
    audio.dataset.id = t.trackId
    audio.volume = 0.85
    audio.addEventListener('play', () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))
    audio.addEventListener('timeupdate', () => { $('.deck-progress i', deck).style.width = (audio.currentTime / (audio.duration || 30)) * 100 + '%' })
    audio.addEventListener('ended', () => { setPlaying(false); say("C'était l'extrait. La suite est sur Apple Music !", [], 4000) })
  }
  if (audio.currentTime >= (audio.duration || 30) - 0.2) audio.currentTime = 0
  audio.play().catch(() => {})
}
// la caméra plonge sur la platine, la musique démarre, les infos flottent à côté
function openDeck() {
  if (current) closeChapter()
  if (shelfOpen) closeShelf()
  deckOpen = true
  renderDeck()
  // on relance l'animation des infos flottantes
  deck.classList.remove('open'); void deck.offsetWidth
  deck.classList.add('open')
  document.body.classList.add('reading', 'listening')
  room.focus('turntable')
  room.panelOpen = true
  hideBubble(); tag.classList.remove('show')
  playMusic()
}
function closeDeck() {
  if (!deckOpen) return
  deckOpen = false
  deck.classList.remove('open')
  document.body.classList.remove('reading', 'listening')
  room.panelOpen = false
  room.unfocus()
}
$('.deck-play', deck).addEventListener('click', () => { sound.click(); playing ? audio?.pause() : playMusic() })
$('.deck-close', deck).addEventListener('click', () => { sound.click(); closeDeck() })
$('.deck-mini', deck).addEventListener('click', () => { sound.click(); openDeck() })
$('.deck-swap', deck).addEventListener('click', () => { sound.click(); openShelf() })

// la discothèque : on choisit un disque, il sort de sa case, on peut le poser sur la platine
let shelfOpen = false, picked = -1
function openShelf() {
  if (current) closeChapter()
  if (deckOpen) closeDeck()
  shelfOpen = true
  loadTracks()
  room.focus('vinyls')
  room.panelOpen = false
  document.body.classList.add('reading', 'browsing')
  tag.classList.remove('show')
  if (innerWidth >= 760) say('Choisis un vinyle, je te le sors de sa case.', [], 4000)
}
function closeShelf() {
  if (!shelfOpen) return
  shelfOpen = false
  putBack()
  room.hoverRecord(-1); hoveredRec = -1; tag.classList.remove('show')
  document.body.classList.remove('reading', 'browsing')
  room.unfocus()
}
function pickRecord(i) {
  picked = i
  room.selectRecord(i)
  room.panelOpen = true
  const r = RECORDS[i]
  $('.deck-meta b', crateCard).textContent = r.title
  $('.deck-meta span', crateCard).textContent = `${r.artist} · ${r.album} · ${r.year}`
  const art = artOf(i)
  $('.deck-cover', crateCard).src = art || ''
  $('.deck-cover', crateCard).style.background = r.spine
  crateCard.classList.add('open')
  hideBubble(); tag.classList.remove('show')
}
function putBack() {
  if (picked < 0) return
  picked = -1
  room.selectRecord(-1)
  room.panelOpen = false
  crateCard.classList.remove('open')
}
// le disque choisi part sur la platine ; l'ancien reprend sa place dans la discothèque
function putOnPlatter() {
  const i = picked
  if (i < 0) return
  audio?.pause(); audio = null
  $('.deck-progress i', deck).style.width = '0%'
  cur = i
  putBack()
  room.setOnPlatter(i)
  shelfOpen = false
  document.body.classList.remove('browsing')
  openDeck()
}
$('.crate-put', crateCard).addEventListener('click', () => { sound.click(); putOnPlatter() })
$('.crate-back', crateCard).addEventListener('click', () => { sound.click(); putBack() })
$('.deck-close', crateCard).addEventListener('click', () => { sound.click(); putBack() })

/* ================= étiquette au survol ================= */
const tag = $('.room-tag')
let hovered = null, hoveredRec = -1
const CAT = { object: 'Le chat', era: 'ne fait pas partie du portfolio', color: '#fcc48b' }
const DECK = () => ({ object: 'Le tourne-disque', era: `${RECORDS[cur].artist} · ${RECORDS[cur].title}`, color: '#ffb35c' })
const SHELF = { object: 'La discothèque', era: `${RECORDS.length} vinyles à écouter`, color: '#ffb35c' }
const CAT_LINES = ["Lui, c'est le chat. Il ne fait pas partie du portfolio, mais il insiste.", 'Chut… il dort. Il a codé toute la nuit, lui aussi.', "Il s'appelle Commit. Il valide tout ce qu'il touche.", 'Ronron. (Traduction : « le bureau est à moi ».)']
let catLine = 0
function petCat() {
  room.focus('cat')
  say(CAT_LINES[catLine++ % CAT_LINES.length], [], 4200)
  setTimeout(() => { if (!current) room.unfocus() }, 4400)
}
function showTag(id) {
  hovered = id
  room.hover(id)
  if (!id || id === current) { tag.classList.remove('show'); return }
  const c = id === 'cat' ? CAT : id === 'turntable' ? DECK() : id === 'vinyls' ? SHELF : byId[id]
  if (id === 'turntable' || id === 'vinyls') loadTracks()
  tag.innerHTML = `<b>${c.object}</b><span>${c.era}${found.has(id) ? ' · déjà vu ✓' : ''}</span>`
  tag.style.setProperty('--c', c.color)
  tag.classList.add('show')
}

/* ================= la scène ================= */
const canvas = $('#scene')
const loader = $('.welcome')

/* ================= l'accueil : un mot de bienvenue avant d'entrer ================= */
// les mots arrivent un à un, en douceur ; le bouton s'active quand la pièce est prête
let wDelay = reduceMotion ? 0 : 0.35
$$('[data-words]', loader).forEach(el => {
  const words = el.textContent.trim().split(/\s+/)
  el.setAttribute('aria-label', el.textContent.trim())
  el.innerHTML = words.map(w => `<span class="wd" aria-hidden="true" style="animation-delay:${(wDelay += reduceMotion ? 0 : 0.075).toFixed(3)}s">${w}</span>`).join(' ')
  wDelay += reduceMotion ? 0 : 0.45
})
loader.style.setProperty('--after', `${wDelay.toFixed(2)}s`)
let entered = false, arrive = () => {}
// mode prise de vue (?shot=objet) : pas d'accueil
if (new URLSearchParams(location.search).has('shot')) loader.hidden = true
const enterBtn = $('.w-enter', loader)
function enter() {
  if (entered || enterBtn.disabled) return
  entered = true
  sound.click(0.9)
  loader.classList.add('gone')
  document.body.classList.add('entered')
  room?.intro()
  setTimeout(() => { loader.hidden = true }, 1400)
  setTimeout(arrive, reduceMotion ? 0 : 1500)
}
enterBtn.addEventListener('click', enter)

async function boot() {
  let createRoom
  try {
    ;({ createRoom } = await import('./room/scene.js'))
    room = await createRoom(canvas, { snapshot, avatar: 'https://avatars.githubusercontent.com/u/90351357?v=4&s=256' })
  } catch (err) {
    console.error(err)
    document.body.classList.add('no-3d')
    arrive = openCarnet
    enterBtn.disabled = false
    loader.classList.add('ready')
    return
  }
  room.setOnPlatter(cur)
  // décale l'image pour que l'objet reste visible à côté du panneau (ou au-dessus sur mobile)
  const fitShift = () => {
    const mobile = innerWidth < 760
    room.panelShiftGoal = mobile ? 0 : (Math.min(480, innerWidth - 20) + 22) / innerWidth / 2
    room.panelShiftYGoal = mobile ? 0.3 : 0
  }
  fitShift()
  addEventListener('resize', fitShift)

  // positions des bulles à chaque image
  room.onFrame(() => {
    const m = room.mascotScreen()
    const w = bubble.offsetWidth, h = bubble.offsetHeight
    const maxX = (current && innerWidth >= 760 ? innerWidth - panel.offsetWidth - 24 : innerWidth) - w / 2 - 12
    const x = Math.max(w / 2 + 12, Math.min(maxX, m.x)), y = Math.max(h + 76, m.y)
    bubble.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    if (hoveredRec >= 0 && tag.classList.contains('show')) {
      const p = room.recordScreen(hoveredRec)
      tag.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -110%)`
    } else if (hovered && tag.classList.contains('show')) {
      const p = room.anchorScreen(hovered)
      tag.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -110%)`
    }
  })

  // souris & doigt : glisser pour tourner, cliquer pour ouvrir
  let down = null, moved = false
  // seul le doigt fait tourner la vue (mobile) ; à la souris, la caméra reste fixe
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; moved = false; canvas.setPointerCapture(e.pointerId) })
  canvas.addEventListener('pointermove', e => {
    if (down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
      if (moved && down.touch) {
        room.rotate(-(e.movementX || 0) * 0.004, (e.movementY || 0) * 0.002)
        canvas.classList.add('grabbing')
        showTag(null)
      }
      return
    }
    // dans la discothèque, on survole les disques un par un
    if (shelfOpen && picked < 0) {
      const i = room.pickRecord(e.clientX, e.clientY)
      canvas.style.cursor = i >= 0 ? 'pointer' : 'default'
      if (i !== hoveredRec) {
        hoveredRec = i
        room.hoverRecord(i)
        if (i >= 0) { const r = RECORDS[i]; tag.innerHTML = `<b>${r.title}</b><span>${r.artist} · ${r.year}</span>`; tag.style.setProperty('--c', r.spine === '#121212' ? '#d8b46a' : '#ffb35c'); tag.classList.add('show') }
        else tag.classList.remove('show')
      }
      return
    }
    const id = room.pick(e.clientX, e.clientY)
    canvas.style.cursor = id ? 'pointer' : 'default'
    if (id !== hovered) showTag(id)
  })
  canvas.addEventListener('pointerup', e => {
    canvas.classList.remove('grabbing')
    if (down && !moved) {
      if (shelfOpen) {
        const i = picked < 0 ? room.pickRecord(e.clientX, e.clientY) : -1
        if (i >= 0) { hoveredRec = -1; tag.classList.remove('show'); pickRecord(i) }
        else if (picked >= 0) putBack()
        else closeShelf()
        down = null
        return
      }
      const id = room.pick(e.clientX, e.clientY)
      if (id === 'cat') petCat()
      else if (id === 'turntable') openDeck()
      else if (id === 'vinyls') openShelf()
      else if (id) openChapter(id)
      else if (deckOpen) closeDeck()
      else if (current) closeChapter()
    }
    down = null
  })
  canvas.addEventListener('pointerleave', () => { if (!down) showTag(null) })
  $$('[data-cam]').forEach(b => b.addEventListener('click', () => {
    sound.click()
    closeChapter(); closeDeck(); closeShelf(); room.reset()
  }))

  document.body.classList.add('ready')
  if (import.meta.env.DEV) window.__bureau = { room, openDeck, openChapter, openShelf, pickRecord, putOnPlatter, enter }

  // mode prise de vue (?shot=objet) : sert à générer les images des études de cas
  const shot = new URLSearchParams(location.search).get('shot')
  if (shot) {
    document.body.classList.add('shot-mode')
    loader.hidden = true
    room.setOnPlatter(+new URLSearchParams(location.search).get('record') || 0)
    room.focus(shot); room.snap()
    room.hideMascot()
    loadTracks()
    return
  }
  enterBtn.disabled = false
  loader.classList.add('ready')
  enterBtn.focus({ preventScroll: true })
  // les pochettes arrivent pendant qu'on lit le mot d'accueil
  loadTracks()

  // arrivée (après l'accueil) : lien direct, ou accueil par la mascotte
  arrive = () => {
  const hash = location.hash.slice(1)
  if (hash === 'carnet') { openCarnet(); return }
  const target = byId[hash] ? hash : ALIASES[hash]
  if (target) { setTimeout(() => openChapter(target), 500); return }
  setTimeout(() => {
    if (found.size === 0) {
      say("Salut ! Moi c'est Osa, la mascotte de Yanis. Bienvenue dans son bureau : ici, chaque objet raconte un bout de son histoire.", [
        ['Fais-moi la visite', startTour, true],
        ["J'explore seul", () => say('Clique sur ce qui te tente. Je te suis !', [], 3500)],
      ])
    } else if (found.size < order.length) {
      say(`Re ! Il te reste ${order.length - found.size} objet${order.length - found.size > 1 ? 's' : ''} à découvrir.`, [
        ['Reprendre la visite', startTour, true],
        ['Explorer', hideBubble],
      ])
    } else {
      say('Re ! Tu connais déjà tout le bureau. Le téléphone est toujours là si tu veux parler à Yanis.', [['Ouvrir le téléphone', () => openChapter('phone'), true]], 8000)
    }
  }, reduceMotion ? 0 : 200)
  }
}
boot()

/* ================= clavier ================= */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, [contenteditable]')) return
  if (!entered) { if (e.key === 'Enter' && e.target === document.body) enter(); return }
  if (e.key === 'Escape') { if (carnet.classList.contains('open')) closeCarnet(); else if (picked >= 0) putBack(); else if (shelfOpen) closeShelf(); else if (deckOpen) closeDeck(); else closeChapter() }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
  if (e.key.toLowerCase() === 't' && !e.repeat) startTour()
  if (e.key.toLowerCase() === 'c' && !e.repeat) carnet.classList.contains('open') ? closeCarnet() : openCarnet()
})
