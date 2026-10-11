// Accueil : le bureau de Yanis. On explore la pièce en 3D, chaque objet ouvre un chapitre.
import './style.css'
import './room/room.css'
import { $, $$, sound, toast, confetti, updateEyes } from './core.js'
import { profile, osalabsApps, stack } from './data.js'
import { chapters, byId } from './room/chapters.js'
import snapshot from './github-snapshot.json'

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
  sound.click(1.1)
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

/* ================= étiquette au survol ================= */
const tag = $('.room-tag')
let hovered = null
function showTag(id) {
  hovered = id
  room.hover(id)
  if (!id || id === current) { tag.classList.remove('show'); return }
  const c = byId[id]
  tag.innerHTML = `<b>${c.object}</b><span>${c.era}${found.has(id) ? ' · déjà vu ✓' : ''}</span>`
  tag.style.setProperty('--c', c.color)
  tag.classList.add('show')
}

/* ================= la scène ================= */
const canvas = $('#scene')
const loader = $('.room-loader')

async function boot() {
  let createRoom
  try {
    ;({ createRoom } = await import('./room/scene.js'))
    room = await createRoom(canvas, { snapshot, avatar: 'https://avatars.githubusercontent.com/u/90351357?v=4&s=256' })
  } catch (err) {
    console.error(err)
    loader.classList.add('gone')
    document.body.classList.add('no-3d')
    openCarnet()
    return
  }
  const day = () => !document.documentElement.classList.contains('dark')
  room.setDay(day())
  addEventListener('themechange', e => {
    room.setDay(!e.detail.dark)
    say(e.detail.dark ? 'Ah, on éteint. Je préfère l\'ambiance de nuit, perso.' : 'Lumière ! On y voit plus clair.', [], 2600)
  })
  room.panelShiftGoal = innerWidth < 760 ? 0 : 0.2
  addEventListener('resize', () => { room.panelShiftGoal = innerWidth < 760 ? 0 : 0.2 })

  // positions des bulles à chaque image
  room.onFrame(() => {
    const m = room.mascotScreen()
    const w = bubble.offsetWidth, h = bubble.offsetHeight
    const maxX = (current && innerWidth >= 760 ? innerWidth - panel.offsetWidth - 24 : innerWidth) - w / 2 - 12
    const x = Math.max(w / 2 + 12, Math.min(maxX, m.x)), y = Math.max(h + 76, m.y)
    bubble.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    if (hovered && tag.classList.contains('show')) {
      const p = room.anchorScreen(hovered)
      tag.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -110%)`
    }
  })

  // souris & doigt : glisser pour tourner, cliquer pour ouvrir
  let down = null, moved = false
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; moved = false; canvas.setPointerCapture(e.pointerId) })
  canvas.addEventListener('pointermove', e => {
    if (down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
      if (moved) {
        room.rotate(-(e.movementX || 0) * 0.004, (e.movementY || 0) * 0.002)
        canvas.classList.add('grabbing')
        showTag(null)
      }
      return
    }
    const id = room.pick(e.clientX, e.clientY)
    canvas.style.cursor = id ? 'pointer' : 'grab'
    if (id !== hovered) { showTag(id); if (id) sound.click(1.35) }
  })
  canvas.addEventListener('pointerup', e => {
    canvas.classList.remove('grabbing')
    if (down && !moved) {
      const id = room.pick(e.clientX, e.clientY)
      if (id) openChapter(id)
      else if (current) closeChapter()
    }
    down = null
  })
  canvas.addEventListener('pointerleave', () => { if (!down) showTag(null) })
  canvas.addEventListener('wheel', e => { e.preventDefault(); room.zoomBy(e.deltaY > 0 ? 0.92 : 1.08) }, { passive: false })
  $$('[data-cam]').forEach(b => b.addEventListener('click', () => {
    sound.click()
    if (b.dataset.cam === 'in') room.zoomBy(1.2)
    if (b.dataset.cam === 'out') room.zoomBy(0.83)
    if (b.dataset.cam === 'home') { closeChapter(); room.reset() }
  }))

  loader.classList.add('gone')
  document.body.classList.add('ready')

  // arrivée : lien direct, ou accueil par la mascotte
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
  }, reduceMotion ? 0 : 700)
}
boot()

/* ================= clavier ================= */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, [contenteditable]')) return
  if (e.key === 'Escape') { if (carnet.classList.contains('open')) closeCarnet(); else closeChapter() }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
  if (e.key.toLowerCase() === 't' && !e.repeat) startTour()
  if (e.key.toLowerCase() === 'c' && !e.repeat) carnet.classList.contains('open') ? closeCarnet() : openCarnet()
  if (e.key.toLowerCase() === 'l' && !e.repeat) $('.theme-toggle').click()
})
