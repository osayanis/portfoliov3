// Démo EraseKEY : l'interface console reproduite en HTML, en accéléré. On coche des disques,
// on choisit la méthode, on tape EFFACER, et la mascotte en pixels suit l'effacement. Rien n'est effacé.
const DISKS = [
  { name: 'Samsung SSD 980 PRO 1TB', size: 1000, kind: 'NVMe', serial: 'S5GXNF0R123456', dev: '/dev/nvme0n1', parts: 4 },
  { name: 'ATA ST2000DM008-2FR102', size: 2000, kind: 'Disque dur', serial: 'ZFL1ABCD', dev: '/dev/sda', parts: 1 },
  { name: 'SanDisk Ultra', size: 32, kind: 'USB', protected: true },
]
const METHODS = [
  { name: 'Conseillée', desc: 'données aléatoires, remise à zéro, puis relecture', passes: 3 },
  { name: 'Rapide', desc: 'une passe de zéros, puis relecture', passes: 2 },
  { name: 'Renforcée', desc: 'trois passes (norme DoD), remise à zéro, relecture', passes: 5 },
]
const SPEED = 412 // Mo/s, comme sur la capture
const RUN_MS = 9000 // la démo dure 9 s, quelle que soit la durée simulée

// la mascotte d'OsaLabs, en caractères pleins comme dans la vraie interface (mascot.go)
function mascot(mood, frame) {
  const blink = frame % 23 === 0 && mood !== 'busy'
  let eyes = ['████ ██ ████', '████ ██ ████']
  if (blink) eyes = ['████████████', '████▀██▀████']
  else if (mood === 'happy') eyes = ['████▄██▄████', '████████████']
  else if (mood === 'busy') eyes = ['█████ ██ ███', '█████ ██ ███']
  else if (mood === 'worried') eyes = ['███▄████▄███', '████ ██ ████']
  const mouth = { happy: ['███▄▀▀▀▀▄███', '▀██████████▀'], worried: ['███▀▄▄▄▄▀███', '▀██████████▀'], busy: ['██████▀▀████', '▀██████████▀'] }[mood] || ['████▀▀▀▀████', '▀██████████▀']
  const rows = ['  ▄██████▄  ', '████████████', ...eyes, ...mouth, '   ▀▀  ▀▀   ']
  let left = '▄', right = '▄', armRow = 3
  if (mood === 'happy') { left = right = '▀'; armRow = frame % 4 < 2 ? 2 : 1 }
  if (mood === 'busy') [left, right] = frame % 2 ? ['▀', '▄'] : ['▄', '▀']
  return rows.map((r, i) => (i === armRow ? left + ' ' : '  ') + r + (i === armRow ? ' ' + right : '  ')).join('\n')
}

const size = mo => mo >= 1000 ? `${(mo / 1000).toFixed(1).replace('.', ',')} To` : `${mo.toFixed(1).replace('.', ',')} Go`
const duration = s => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min` }

export default function erase(root, { sound }) {
  root.innerHTML = `
    <div class="ek">
      <div class="ek-monitor">
        <div class="ek-screen" tabindex="0" role="application" aria-label="Démo de l'interface EraseKEY : flèches pour choisir, Espace pour cocher, Entrée pour continuer, Échap pour revenir">
          <p class="ek-head"><b><span class="ek-logo" aria-hidden="true">▀▄</span> EraseKEY</b> <span class="ek-dim">par OsaBoot · OsaLabs</span></p>
          <div class="ek-top">
            <div class="ek-mascot" aria-hidden="true"></div>
            <p class="ek-bubble" aria-live="polite"></p>
          </div>
          <div class="ek-panel"></div>
          <p class="ek-hints"></p>
          <div class="ek-off" hidden><p>Le PC s'éteint.</p><button type="button" class="ek-key" data-act="restart">Rallumer</button></div>
        </div>
        <span class="ek-led" aria-hidden="true"></span>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const screen = $('.ek-screen'), panel = $('.ek-panel'), hints = $('.ek-hints'), bubble = $('.ek-bubble'), pre = $('.ek-mascot')
  let step = 'disks', cursor = 0, checked = new Set(), method = 0, typed = '', mood = 'calm', frame = 1
  let run = null, timer = null, blinkTimer = null, stopped = false

  // chaque caractère = deux demi-pixels (█ les deux, ▀ le haut, ▄ le bas) : on dessine des carrés nets en SVG
  const draw = () => {
    const rows = mascot(mood, frame).split('\n'), w = Math.max(...rows.map(r => r.length))
    let rects = ''
    rows.forEach((r, y) => [...r].forEach((c, x) => {
      if (c === '█') rects += `<rect x="${x}" y="${y * 2}" width="1" height="2"/>`
      else if (c === '▀') rects += `<rect x="${x}" y="${y * 2}" width="1" height="1"/>`
      else if (c === '▄') rects += `<rect x="${x}" y="${y * 2 + 1}" width="1" height="1"/>`
    }))
    pre.innerHTML = `<svg viewBox="0 0 ${w} ${rows.length * 2}" shape-rendering="crispEdges" fill="currentColor">${rects}</svg>`
  }
  const say = t => { bubble.textContent = t }
  const chosen = () => DISKS.filter((d, i) => checked.has(i))
  const hint = list => list.map(([k, label, act]) => act ? `<button type="button" class="ek-key" data-act="${act}">${k} ${label}</button>` : `<span>${k} ${label}</span>`).join('<span class="ek-sep"> · </span>')

  function render() {
    screen.classList.toggle('alert', step === 'confirm')
    if (step === 'disks') {
      mood = 'calm'
      panel.innerHTML = `<p class="ek-title">Les disques de ce PC</p>
        <div class="ek-list">${DISKS.map((d, i) => d.protected
          ? `<div class="ek-row off"><span class="ek-cur"></span><span class="ek-box"></span><span class="ek-name">${d.name}</span><span class="ek-size">${size(d.size)}</span><span class="ek-info">protégé : ta clé EraseKEY</span></div>`
          : `<div class="ek-row${cursor === i ? ' on' : ''}" data-row="${i}"><span class="ek-cur">${cursor === i ? '▶' : ''}</span><span class="ek-box">[${checked.has(i) ? 'x' : ' '}]</span><span class="ek-name">${d.name}</span><span class="ek-size">${size(d.size)}</span><span class="ek-info">${d.kind} · n° ${d.serial}</span></div>`).join('')}</div>`
      hints.innerHTML = hint([['↑↓', 'choisir'], ['Espace', 'cocher plusieurs', 'toggle'], ['Entrée', 'continuer', 'enter']])
    } else if (step === 'method') {
      mood = 'calm'
      panel.innerHTML = `<p class="ek-title">Méthode <span class="ek-dim">pour ${chosen().map(d => `${d.name} (${size(d.size)})`).join(', ')}</span></p>
        <div class="ek-list">${METHODS.map((m, i) => `<div class="ek-row ek-method${method === i ? ' on' : ''}" data-row="${i}"><span class="ek-cur">${method === i ? '▶' : ''}</span><span class="ek-name">${m.name}</span><span class="ek-info">${m.desc}</span></div>`).join('')}</div>`
      hints.innerHTML = hint([['↑↓', 'choisir'], ['Entrée', 'continuer', 'enter'], ['Échap', 'revenir', 'back']])
    } else if (step === 'confirm') {
      mood = 'worried'
      panel.innerHTML = `<p class="ek-title ek-red">Tout va être effacé, sans retour possible</p>
        <div class="ek-list">${chosen().map(d => `<div class="ek-sum"><b>■ ${d.name}</b> <span>${size(d.size)} · ${d.kind} · ${d.dev}</span><span class="ek-dim">numéro de série ${d.serial}</span><span class="ek-dim">${d.parts} partition(s) : elles disparaîtront toutes</span></div>`).join('')}</div>
        <p class="ek-dim">Méthode : ${METHODS[method].name}, ${METHODS[method].desc}</p>
        <label class="ek-type"><b>Pour confirmer, tape EFFACER :</b><span>▶ <input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" aria-label="Tape EFFACER pour confirmer" value="${typed.replace(/"/g, '&quot;')}"></span></label>`
      hints.innerHTML = hint([['tape EFFACER puis', 'Entrée', 'enter'], ['Échap', 'revenir', 'back']])
      const input = $('.ek-type input')
      input.addEventListener('input', () => { typed = input.value })
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); enter() }
        if (e.key === 'Escape') { e.preventDefault(); back() }
        e.stopPropagation()
      })
      requestAnimationFrame(() => input.focus({ preventScroll: true }))
    } else if (step === 'run') {
      mood = 'busy'
      panel.innerHTML = `<p class="ek-title">Effacement en cours<span class="ek-dots"></span></p>
        <div class="ek-list">${chosen().map((d, i) => `<div class="ek-bar"><p><b>${d.name}</b> <span class="ek-dim">${size(d.size)}</span></p><div><i><em data-bar="${i}"></em></i><b data-pct="${i}">0 %</b></div></div>`).join('')}</div>
        <p class="ek-dim ek-stats"></p>`
      hints.innerHTML = hint([['A', 'arrêter', 'stop']])
    } else if (step === 'done') {
      mood = 'happy'
      const total = Math.max(...chosen().map(d => d.size)) * METHODS[method].passes * 1000 / SPEED
      panel.innerHTML = `<p class="ek-title">Terminé</p>
        <div class="ek-list">${chosen().map(d => `<p class="ek-res"><b class="ek-green">✓ réussi</b> ${d.name} <span class="ek-dim">${size(d.size)}</span></p>`).join('')}</div>
        <p class="ek-dim">Durée : ${duration(total)} · méthode ${METHODS[method].name.toLowerCase()}<br>Journal et rapport PDF : sur la clé, à côté du LISEZMOI.</p>`
      hints.innerHTML = hint([['Entrée', 'effacer un autre disque', 'enter'], ['E', 'éteindre le PC', 'off'], ['R', 'redémarrer', 'restart']])
    }
    draw()
  }

  function go(next, text) { step = next; render(); if (text) say(text) }

  function enter() {
    if (step === 'disks') {
      if (!checked.size) { sound.blip(300); return say('Coche au moins un disque avec Espace (ou clique dessus).') }
      sound.click(1.1); go('method', 'Comment l’effacer ? La méthode conseillée suffit pour un disque qu’on donne ou qu’on vend.')
    } else if (step === 'method') {
      typed = ''; sound.blip(700); go('confirm', 'Dernière vérification : tout ce qu’il y a dessus va disparaître pour toujours. Rien ne pourra être récupéré.')
    } else if (step === 'confirm') {
      if (typed.trim().toUpperCase() !== 'EFFACER') { sound.blip(300); return say('Il faut taper EFFACER, en entier, pour que je commence.') }
      sound.blip(1300); start()
    } else if (step === 'done') reset()
  }
  function back() {
    if (step === 'method') { sound.click(0.9); go('disks', 'Quel disque veux-tu effacer complètement ? Ta clé EraseKEY est protégée, je n’y toucherai pas.') }
    else if (step === 'confirm') { sound.click(0.9); go('method', 'Comment l’effacer ? La méthode conseillée suffit pour un disque qu’on donne ou qu’on vend.') }
  }
  function move(d) {
    if (step === 'disks') { const n = DISKS.filter(x => !x.protected).length; cursor = (cursor + d + n) % n }
    else if (step === 'method') method = (method + d + METHODS.length) % METHODS.length
    else return
    sound.click(1.3); render()
  }
  function toggle(i = cursor) {
    if (step !== 'disks' || DISKS[i]?.protected) return
    cursor = i
    checked.has(i) ? checked.delete(i) : checked.add(i)
    sound.click(1.1); render()
  }

  function start() {
    go('run', 'J’efface… Laisse le PC allumé et la clé branchée. Tu peux aller boire un café.')
    screen.focus({ preventScroll: true })
    const disks = chosen(), passes = METHODS[method].passes
    const simTotal = Math.max(...disks.map(d => d.size)) * passes * 1000 / SPEED // secondes simulées
    const t0 = performance.now()
    stopped = false
    clearInterval(timer)
    timer = setInterval(() => {
      if (!root.isConnected) return clearInterval(timer)
      const f = Math.min(1, (performance.now() - t0) / RUN_MS)
      const sim = f * simTotal
      disks.forEach((d, i) => {
        const p = Math.min(1, sim / (d.size * passes * 1000 / SPEED))
        root.querySelector(`[data-bar="${i}"]`).style.width = `${p * 100}%`
        root.querySelector(`[data-pct="${i}"]`).textContent = `${Math.floor(p * 100)} %`
      })
      frame++; draw()
      $('.ek-dots').textContent = '·'.repeat(frame % 3 + 1)
      $('.ek-stats').textContent = `Méthode ${METHODS[method].name.toLowerCase()} · depuis ${sim < 60 ? 'moins d’une minute' : duration(sim)} · ${SPEED} Mo/s · encore environ ${duration(Math.max(60, simTotal - sim))}`
      if (f >= 1) {
        clearInterval(timer)
        frame = 1; sound.blip(1600)
        go('done', 'C’est fait ! Les disques sont vides et vérifiés. Les rapports sont enregistrés sur la clé.')
      }
    }, 120)
  }
  function stop() {
    clearInterval(timer); sound.blip(400); frame = 1
    go('disks', 'Arrêté. (Dans la démo, rien n’était effacé de toute façon.)')
  }
  function reset() {
    clearInterval(timer); checked = new Set(); cursor = 0; method = 0; typed = ''; frame = 1
    $('.ek-off').hidden = true
    go('disks', 'Salut ! Quel disque veux-tu effacer complètement ? Ta clé EraseKEY est protégée, je n’y toucherai pas.')
  }

  screen.addEventListener('keydown', e => {
    if (e.target.closest('input')) return
    const k = e.key
    if (k === 'ArrowUp') move(-1)
    else if (k === 'ArrowDown') move(1)
    else if (k === ' ' && step === 'disks') toggle()
    else if (k === 'Enter') enter()
    else if (k === 'Escape') back()
    else if ((k === 'a' || k === 'A') && step === 'run') stop()
    else if ((k === 'e' || k === 'E') && step === 'done') { $('.ek-off').hidden = false; sound.click(0.8) }
    else if ((k === 'r' || k === 'R') && step === 'done') reset()
    else return
    e.preventDefault()
  })
  screen.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'toggle') return toggle()
    if (act === 'enter') return enter()
    if (act === 'back') return back()
    if (act === 'stop') return stop()
    if (act === 'off') { $('.ek-off').hidden = false; return sound.click(0.8) }
    if (act === 'restart') return reset()
    const row = e.target.closest('[data-row]')
    if (!row) return
    const i = +row.dataset.row
    if (step === 'disks') toggle(i)
    else if (step === 'method') { if (method === i) enter(); else { method = i; sound.click(1.3); render() } }
  })

  // clignement des yeux de temps en temps, seulement quand rien ne bouge
  blinkTimer = setInterval(() => {
    if (!root.isConnected) return clearInterval(blinkTimer)
    if (step === 'run') return
    frame = 23; draw()
    setTimeout(() => { frame = 1; draw() }, 160)
  }, 4200)

  reset()
}
