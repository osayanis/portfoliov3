// Démo OpenPod : la molette tactile. Les coordonnées du doigt sont converties
// en angle avec atan2, et chaque fraction de tour fait défiler le menu d'un cran.
const MENUS = {
  root: { title: 'OpenPod', items: ['Musique', 'Albums', 'Artistes', 'Playlists', 'Lecture aléatoire', 'Réglages', 'À propos'] },
  Albums: { title: 'Albums', items: ['Discovery', 'Random Access Memories', 'In Rainbows', 'Currents', 'Blonde', 'Kind of Blue'] },
  Artistes: { title: 'Artistes', items: ['Daft Punk', 'Radiohead', 'Tame Impala', 'Frank Ocean', 'Miles Davis'] },
  Réglages: { title: 'Réglages', items: ['Lecture bit-perfect : oui', 'Égaliseur : désactivé', 'Bluetooth : écouteurs', 'Luminosité : 60 %'] },
}
const STEP = 30 // degrés par cran

export default function wheel(root, { sound }) {
  root.innerHTML = `
    <div class="wd">
      <div class="wd-device">
        <div class="wd-screen"><div class="wd-status"><span class="wd-title">OpenPod</span><span>▮▮▮▯</span></div><ul class="wd-list"></ul><div class="wd-now" hidden><span class="wd-cover"></span><b></b><small>Lecture · 44,1 kHz · 16 bits</small><div class="wd-prog"><i></i></div></div></div>
        <div class="wd-wheel" tabindex="0" aria-label="Molette : glisse en cercle, flèches haut et bas pour défiler, Entrée pour valider">
          <span class="wd-lbl t">MENU</span><span class="wd-lbl b">⏯</span><span class="wd-lbl l">⏮</span><span class="wd-lbl r">⏭</span>
          <span class="wd-dot"></span>
          <button type="button" class="wd-center" aria-label="Valider"></button>
        </div>
      </div>
      <div class="wd-math">
        <p class="wd-kicker">Ce que calcule l'OS</p>
        <code class="wd-xy">x = 0 · y = 0</code>
        <code class="wd-angle">θ = atan2(y, x) = 0°</code>
        <code class="wd-delta">Δθ cumulé = 0° → 0 cran</code>
        <p class="wd-help">Glisse en cercle sur la molette (sens horaire pour descendre). Le bouton central valide, « MENU » revient en arrière.</p>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const list = $('.wd-list'), wheelEl = $('.wd-wheel'), dot = $('.wd-dot')
  let menu = 'root', sel = 0, stack = []

  function render() {
    const m = MENUS[menu]
    $('.wd-title').textContent = m.title
    list.innerHTML = m.items.map((it, i) => `<li class="${i === sel ? 'on' : ''}">${it}${MENUS[it] || menu === 'Albums' || menu === 'Artistes' || it === 'Musique' ? '<span>›</span>' : ''}</li>`).join('')
    list.querySelector('.on')?.scrollIntoView({ block: 'nearest' })
  }
  function move(d) {
    const n = MENUS[menu].items.length
    const next = Math.max(0, Math.min(n - 1, sel + d))
    if (next !== sel) { sel = next; render(); sound.blip(1500) }
  }
  function enter() {
    sound.click(1.2)
    const item = MENUS[menu].items[sel]
    if (!$('.wd-now').hidden) return
    if (MENUS[item]) { stack.push([menu, sel]); menu = item; sel = 0; render(); return }
    if (menu === 'Albums' || menu === 'Artistes' || item === 'Musique' || item === 'Lecture aléatoire') {
      const now = $('.wd-now')
      now.hidden = false
      list.hidden = true
      now.querySelector('b').textContent = menu === 'root' ? 'Lecture aléatoire' : item
      $('.wd-title').textContent = 'Lecture'
    }
  }
  function back() {
    sound.click(0.9)
    if (!$('.wd-now').hidden) { $('.wd-now').hidden = true; list.hidden = false; render(); return }
    if (stack.length) { [menu, sel] = stack.pop(); render() }
  }

  // la molette : angle avec atan2, et un cran tous les 30°
  let lastAngle = null, acc = 0, total = 0
  const angleAt = e => {
    const r = wheelEl.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
    return { x, y, a: Math.atan2(y, x) * 180 / Math.PI, r: Math.hypot(x, y) / (r.width / 2), rect: r }
  }
  wheelEl.addEventListener('pointerdown', e => {
    if (e.target.closest('.wd-center')) return
    const p = angleAt(e)
    if (p.y < -p.rect.height * 0.28 && Math.abs(p.x) < p.rect.width * 0.2) { back(); return }
    wheelEl.setPointerCapture(e.pointerId)
    lastAngle = p.a
    wheelEl.classList.add('touch')
  })
  wheelEl.addEventListener('pointermove', e => {
    if (lastAngle === null) return
    const p = angleAt(e)
    let d = p.a - lastAngle
    if (d > 180) d -= 360
    if (d < -180) d += 360
    lastAngle = p.a
    acc += d; total += d
    while (acc >= STEP) { acc -= STEP; move(1) }
    while (acc <= -STEP) { acc += STEP; move(-1) }
    dot.style.transform = `rotate(${p.a}deg) translateX(${Math.min(1, p.r) * 42}%)`
    $('.wd-xy').textContent = `x = ${Math.round(p.x)} · y = ${Math.round(-p.y)}`
    $('.wd-angle').textContent = `θ = atan2(y, x) = ${Math.round(-p.a)}°`
    $('.wd-delta').textContent = `Δθ cumulé = ${Math.round(total)}° → ${Math.trunc(total / STEP)} cran${Math.abs(Math.trunc(total / STEP)) > 1 ? 's' : ''}`
  })
  const end = () => { lastAngle = null; wheelEl.classList.remove('touch') }
  wheelEl.addEventListener('pointerup', end)
  wheelEl.addEventListener('pointercancel', end)
  $('.wd-center').addEventListener('click', enter)
  wheelEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    if (e.key === 'Enter') { e.preventDefault(); enter() }
    if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); back() }
  })

  render()
}
