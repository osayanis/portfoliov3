// Démo Clavio : le mode « pas à pas ». Les notes tombent vers le clavier,
// et la musique s'arrête tant que la bonne touche n'est pas jouée.
const KEYS = [
  { n: 'Do', f: 261.63, code: 'KeyA', l: 'Q' },
  { n: 'Ré', f: 293.66, code: 'KeyS', l: 'S' },
  { n: 'Mi', f: 329.63, code: 'KeyD', l: 'D' },
  { n: 'Fa', f: 349.23, code: 'KeyF', l: 'F' },
  { n: 'Sol', f: 392.0, code: 'KeyG', l: 'G' },
  { n: 'La', f: 440.0, code: 'KeyH', l: 'H' },
  { n: 'Si', f: 493.88, code: 'KeyJ', l: 'J' },
  { n: 'Do', f: 523.25, code: 'KeyK', l: 'K' },
]
// Ode à la joie (début) : [touche, durée en temps]
const SONG = [[2, 1], [2, 1], [3, 1], [4, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 1], [1, 1], [2, 1], [2, 1.5], [1, 0.5], [1, 2],
  [2, 1], [2, 1], [3, 1], [4, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1], [0, 1], [1, 1], [2, 1], [1, 1.5], [0, 0.5], [0, 2]]
const BEAT = 0.55 // secondes par temps
const SPEED = 140 // pixels par seconde

export default function falling(root, { sound, confetti }) {
  root.innerHTML = `
    <div class="fd">
      <div class="fd-head">
        <div><b>Ode à la joie</b><small>Beethoven · mode pas à pas</small></div>
        <div class="fd-score"><span>Précision <b class="fd-acc">100 %</b></span><span>Série <b class="fd-combo">0</b> 🔥</span></div>
        <button type="button" class="btn fd-restart">Recommencer</button>
      </div>
      <div class="fd-roll"><div class="fd-lanes">${KEYS.map(() => '<span></span>').join('')}</div><div class="fd-notes"></div><div class="fd-line"></div><p class="fd-wait">La musique t'attend…</p></div>
      <div class="fd-keys">${KEYS.map((k, i) => `<button type="button" data-i="${i}"><b>${k.n}</b><kbd>${k.l}</kbd></button>`).join('')}</div>
    </div>`

  const roll = root.querySelector('.fd-roll'), notesEl = root.querySelector('.fd-notes')
  const keyEls = [...root.querySelectorAll('.fd-keys button')]
  let notes, songTime, idx, hits, misses, combo, last, done, active = false

  navigator.keyboard?.getLayoutMap?.().then(m => keyEls.forEach((b, i) => { const l = m.get(KEYS[i].code); if (l) b.querySelector('kbd').textContent = l.toUpperCase() })).catch(() => {})

  function reset() {
    notesEl.innerHTML = ''
    let t = 1.5
    notes = SONG.map(([k, d]) => {
      const el = document.createElement('i')
      el.style.left = `calc(${(k / KEYS.length) * 100}% + 4px)`
      el.style.height = Math.max(26, d * BEAT * SPEED - 6) + 'px'
      el.textContent = KEYS[k].n
      notesEl.appendChild(el)
      const n = { k, t, d, el, played: false }
      t += d * BEAT
      return n
    })
    songTime = 0; idx = 0; hits = 0; misses = 0; combo = 0; done = false
    update()
  }

  function update() {
    root.querySelector('.fd-acc').textContent = Math.round((hits / Math.max(1, hits + misses)) * 100) + ' %'
    root.querySelector('.fd-combo').textContent = combo
    keyEls.forEach((b, i) => b.classList.toggle('next', !done && notes[idx]?.k === i))
  }

  function play(i) {
    sound.note(KEYS[i].f, 0.7)
    const b = keyEls[i]
    b.classList.add('down')
    setTimeout(() => b.classList.remove('down'), 160)
    if (done) return
    const n = notes[idx]
    // on accepte la note quand elle est proche de la ligne
    if (n && n.k === i && n.t - songTime < 0.6) {
      n.played = true
      n.el.classList.add('hit')
      idx++; hits++; combo++
      if (idx === notes.length) {
        done = true
        setTimeout(() => { sound.chime(); confetti() }, 300)
        root.querySelector('.fd-wait').textContent = 'Bravo, morceau terminé ! 🎉'
        roll.classList.add('waiting')
      }
    } else {
      misses++; combo = 0
      b.classList.add('wrong')
      setTimeout(() => b.classList.remove('wrong'), 250)
    }
    update()
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const n = notes[idx]
    // pas à pas : on avance jusqu'à la prochaine note, puis on l'attend
    const waiting = !done && n && songTime >= n.t
    if (!waiting && !done) songTime += dt
    if (waiting) songTime = n.t
    roll.classList.toggle('waiting', waiting || done)
    const H = roll.clientHeight, lineY = H - 18
    for (const x of notes) {
      const y = lineY - (x.t - songTime) * SPEED - x.el.offsetHeight
      x.el.style.transform = `translateY(${y}px)`
      x.el.style.visibility = y < -x.el.offsetHeight || y > H ? 'hidden' : 'visible'
    }
    if (active) requestAnimationFrame(frame)
  }

  keyEls.forEach((b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); play(i) }))
  root.querySelector('.fd-restart').addEventListener('click', () => { sound.click(); reset() })
  addEventListener('keydown', e => {
    if (!active || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    const i = KEYS.findIndex(k => k.code === e.code)
    if (i >= 0) { e.preventDefault(); play(i) }
  })

  reset()
  // la démo ne tourne (et n'écoute le clavier) que lorsqu'elle est visible
  new IntersectionObserver(([en]) => {
    const was = active
    active = en.isIntersecting
    if (active && !was) { last = performance.now(); requestAnimationFrame(frame) }
  }, { threshold: 0.4 }).observe(root)
}
