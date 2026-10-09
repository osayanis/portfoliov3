// Démo OsaParty : un hôte, trois invités avec des connexions différentes.
// Avec la synchro, chaque invité se recale sur la position envoyée par l'hôte.
const LYRICS = ['On lance la soirée', 'Tout le monde au même endroit', 'La même seconde partout', 'Même à mille kilomètres', 'Le refrain arrive…', '…et tout le monde chante']
const DURATION = 24 // secondes, un morceau qui boucle
const GUESTS = [
  { name: 'Léa', where: 'Wi-Fi', lat: 0.04, rate: 1.0, c: '#f3a6cf' },
  { name: 'Hugo', where: '4G', lat: 0.18, rate: 0.985, c: '#93c5fd' },
  { name: 'Inès', where: 'train', lat: 0.6, rate: 1.025, c: '#fde68a' },
]
const REACTIONS = ['🔥', '💃', '😍', '🤯', '😴', '🍻']

export default function party(root, { sound }) {
  root.innerHTML = `
    <div class="pd">
      <div class="pd-top">
        <label class="pd-switch"><input type="checkbox" checked /> <span></span> Synchronisation</label>
        <div class="pd-reacts" aria-label="Envoyer une réaction">${REACTIONS.map(r => `<button type="button">${r}</button>`).join('')}</div>
      </div>
      <div class="pd-rows">
        <div class="pd-row host">
          <span class="pd-av" style="--c:#c4b5fd">Y</span>
          <div class="pd-info"><b>Yanis · hôte</b><small>diffuse depuis son Mac</small></div>
          <div class="pd-track"><div class="pd-bar"><i></i></div><p class="pd-lyric"></p></div>
          <span class="pd-off ok">référence</span>
        </div>
        ${GUESTS.map(g => `
          <div class="pd-row guest">
            <span class="pd-av" style="--c:${g.c}">${g.name[0]}</span>
            <div class="pd-info"><b>${g.name}</b><small>${g.where} · ${Math.round(g.lat * 1000)} ms</small></div>
            <div class="pd-track"><div class="pd-bar"><i></i></div><p class="pd-lyric"></p></div>
            <span class="pd-off"></span>
          </div>`).join('')}
      </div>
      <p class="pd-note">Sans synchro, chaque lecteur dérive à son rythme. Avec, l'hôte envoie sa position et chacun se recale en tenant compte de son délai.</p>
      <div class="pd-float" aria-hidden="true"></div>
    </div>`

  const rows = [...root.querySelectorAll('.pd-row')]
  const sync = root.querySelector('.pd-switch input')
  const float = root.querySelector('.pd-float')
  let host = 0
  const pos = GUESTS.map(() => 0)
  let last = performance.now(), lastSync = 0

  sync.addEventListener('change', () => { sound.click(); if (sync.checked) lastSync = 0 })

  function lyricAt(t) { return LYRICS[Math.floor(((t % DURATION) + DURATION) % DURATION / (DURATION / LYRICS.length))] }
  function paint(row, t) {
    const p = ((t % DURATION) + DURATION) % DURATION
    row.querySelector('.pd-bar i').style.width = (p / DURATION) * 100 + '%'
    const ly = row.querySelector('.pd-lyric'), txt = lyricAt(t)
    if (ly.textContent !== txt) { ly.textContent = txt; ly.classList.remove('pop'); void ly.offsetWidth; ly.classList.add('pop') }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    host += dt
    GUESTS.forEach((g, i) => {
      pos[i] += dt * (sync.checked ? 1 : g.rate)
      // la position de l'hôte arrive avec le délai du réseau : l'invité ajoute ce délai pour se recaler
      if (sync.checked && now - lastSync > 1000) {
        const received = host - g.lat
        pos[i] = received + g.lat
      }
    })
    if (sync.checked && now - lastSync > 1000) {
      lastSync = now
      rows.slice(1).forEach(r => { r.classList.remove('resync'); void r.offsetWidth; r.classList.add('resync') })
    }
    paint(rows[0], host)
    GUESTS.forEach((g, i) => {
      // sans synchro, l'invité entend aussi le morceau avec son retard réseau
      const heard = sync.checked ? pos[i] : pos[i] - g.lat
      paint(rows[i + 1], heard)
      const off = Math.round((heard - host) * 1000)
      const el = rows[i + 1].querySelector('.pd-off')
      el.textContent = (off > 0 ? '+' : '') + off + ' ms'
      el.className = 'pd-off ' + (Math.abs(off) < 120 ? 'ok' : Math.abs(off) < 600 ? 'meh' : 'bad')
    })
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  root.querySelectorAll('.pd-reacts button').forEach(b => b.addEventListener('click', () => {
    sound.blip(880 + Math.random() * 400)
    for (let k = 0; k < 4; k++) {
      const e = document.createElement('span')
      e.textContent = b.textContent
      e.style.left = 10 + Math.random() * 80 + '%'
      e.style.animationDelay = k * 90 + 'ms'
      e.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px')
      float.appendChild(e)
      setTimeout(() => e.remove(), 2200)
    }
  }))
}
