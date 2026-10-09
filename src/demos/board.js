// Démo OsaBoard : un canvas miniature. Les blocs se déplacent, les liens suivent,
// et deux participants fictifs bougent leur curseur en même temps que toi.
const KINDS = {
  text: { icon: 'T', name: 'Texte', c: '#e5e7eb', body: () => `<p contenteditable="true" spellcheck="false">Idée : un mode soirée pour OsaParty</p>` },
  check: { icon: '✓', name: 'Checklist', c: '#a7e8bd', body: () => `<label><input type="checkbox" checked> Maquette</label><label><input type="checkbox"> Prototype</label><label><input type="checkbox"> Mise en ligne</label>` },
  poll: { icon: '◔', name: 'Sondage', c: '#93c5fd', body: () => `<p class="bd-q">On ship vendredi ?</p><button type="button" data-v="0">Oui <b>3</b></button><button type="button" data-v="1">Lundi <b>1</b></button>` },
  timer: { icon: '⏱', name: 'Chrono', c: '#fcc48b', body: () => `<p class="bd-timer">05:00</p><button type="button" class="bd-start">Démarrer</button>` },
  code: { icon: '</>', name: 'Code', c: '#c4b5fd', body: () => `<pre>dc.send(chunk)\n// 16 Ko max</pre>` },
  note: { icon: '✎', name: 'Note', c: '#fde68a', body: () => `<p contenteditable="true" spellcheck="false">Penser aux curseurs en direct !</p>` },
}

export default function board(root, { sound }) {
  root.innerHTML = `
    <div class="bd">
      <div class="bd-canvas">
        <svg class="bd-edges"></svg>
        <span class="bd-cursor" data-who="0" style="--c:#f472b6"><svg viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z"/></svg><b>Chloé</b></span>
        <span class="bd-cursor" data-who="1" style="--c:#60a5fa"><svg viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z"/></svg><b>Bob</b></span>
      </div>
      <div class="bd-toolbar" role="toolbar" aria-label="Ajouter un bloc">
        ${Object.entries(KINDS).map(([k, v]) => `<button type="button" data-kind="${k}" style="--c:${v.c}"><span>${v.icon}</span>${v.name}</button>`).join('')}
      </div>
    </div>`

  const canvas = root.querySelector('.bd-canvas'), edgesSvg = root.querySelector('.bd-edges')
  const nodes = [], edges = []
  let z = 1

  function addNode(kind, x, y, linkFrom) {
    const k = KINDS[kind]
    const el = document.createElement('div')
    el.className = 'bd-node'
    el.style.setProperty('--c', k.c)
    el.innerHTML = `<header><span>${k.icon}</span>${k.name}</header><div class="bd-body">${k.body()}</div><i class="bd-handle l"></i><i class="bd-handle r"></i>`
    canvas.appendChild(el)
    const n = { el, x, y }
    nodes.push(n)
    place(n)
    drag(n)
    wire(n, kind)
    if (linkFrom) edges.push([linkFrom, n])
    el.animate([{ transform: el.style.transform + ' scale(.6)', opacity: 0 }, { transform: el.style.transform, opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' })
    drawEdges()
    return n
  }
  function place(n) {
    const W = canvas.clientWidth, H = canvas.clientHeight
    n.x = Math.max(0, Math.min(W - n.el.offsetWidth, n.x))
    n.y = Math.max(0, Math.min(H - n.el.offsetHeight, n.y))
    n.el.style.transform = `translate(${n.x}px, ${n.y}px)`
  }
  function drawEdges() {
    edgesSvg.setAttribute('viewBox', `0 0 ${canvas.clientWidth} ${canvas.clientHeight}`)
    edgesSvg.innerHTML = edges.map(([a, b]) => {
      const ax = a.x + a.el.offsetWidth, ay = a.y + a.el.offsetHeight / 2
      const bx = b.x, by = b.y + b.el.offsetHeight / 2
      const [x1, y1, x2, y2] = ax <= bx ? [ax, ay, bx, by] : [b.x + b.el.offsetWidth, by, a.x, ay]
      const d = Math.max(40, Math.abs(x2 - x1) / 2)
      return `<path d="M${x1} ${y1} C${x1 + d} ${y1}, ${x2 - d} ${y2}, ${x2} ${y2}"/>`
    }).join('')
  }
  function drag(n) {
    const head = n.el.querySelector('header')
    head.addEventListener('pointerdown', e => {
      e.preventDefault()
      head.setPointerCapture(e.pointerId)
      n.el.style.zIndex = ++z
      n.el.classList.add('dragging')
      sound.click(1.1)
      const sx = e.clientX - n.x, sy = e.clientY - n.y
      const mv = ev => { n.x = ev.clientX - sx; n.y = ev.clientY - sy; place(n); drawEdges() }
      const up = () => { head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up); n.el.classList.remove('dragging') }
      head.addEventListener('pointermove', mv)
      head.addEventListener('pointerup', up)
    })
    n.el.addEventListener('pointerdown', () => { n.el.style.zIndex = ++z; selected = n })
  }
  function wire(n, kind) {
    if (kind === 'poll') n.el.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { const v = b.querySelector('b'); v.textContent = +v.textContent + 1; sound.blip(900) }))
    if (kind === 'check') n.el.querySelectorAll('input').forEach(i => i.addEventListener('change', () => sound.click()))
    if (kind === 'timer') {
      const t = n.el.querySelector('.bd-timer'), b = n.el.querySelector('.bd-start')
      let left = 300, iv = null
      b.addEventListener('click', () => {
        sound.click()
        if (iv) { clearInterval(iv); iv = null; b.textContent = 'Démarrer'; return }
        b.textContent = 'Pause'
        iv = setInterval(() => { left = Math.max(0, left - 1); t.textContent = `${String(left / 60 | 0).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` }, 1000)
      })
    }
  }

  // tableau de départ
  const W = canvas.clientWidth
  const a = addNode('text', W * 0.04, 30)
  const b = addNode('check', W * 0.36, 120, a)
  addNode('poll', W * 0.68, 24, b)
  let selected = b

  root.querySelectorAll('.bd-toolbar button').forEach(btn => btn.addEventListener('click', () => {
    sound.click()
    const W = canvas.clientWidth, H = canvas.clientHeight
    const from = selected || nodes[nodes.length - 1]
    // on cherche l'emplacement qui chevauche le moins les blocs existants
    let best = null
    for (let k = 0; k < 40; k++) {
      const x = Math.random() * (W - 200), y = Math.random() * (H - 170)
      const overlap = nodes.reduce((sum, m) => {
        const ox = Math.max(0, Math.min(x + 200, m.x + m.el.offsetWidth) - Math.max(x, m.x))
        const oy = Math.max(0, Math.min(y + 160, m.y + m.el.offsetHeight) - Math.max(y, m.y))
        return sum + ox * oy
      }, 0)
      if (!best || overlap < best.o) best = { x, y, o: overlap }
    }
    const n = addNode(btn.dataset.kind, best.x, best.y, from)
    selected = n
  }))

  addEventListener('resize', () => { nodes.forEach(place); drawEdges() })

  // curseurs des autres participants
  const cursors = [...root.querySelectorAll('.bd-cursor')]
  const targets = cursors.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 }))
  function pickTarget(i) {
    const n = nodes[(Math.random() * nodes.length) | 0]
    targets[i].tx = n.x + 20 + Math.random() * (n.el.offsetWidth - 40)
    targets[i].ty = n.y + 20 + Math.random() * (n.el.offsetHeight - 20)
  }
  cursors.forEach((_, i) => { pickTarget(i); setInterval(() => pickTarget(i), 1600 + i * 700) })
  ;(function loop() {
    targets.forEach((t, i) => {
      t.x += (t.tx - t.x) * 0.06
      t.y += (t.ty - t.y) * 0.06
      cursors[i].style.transform = `translate(${t.x}px, ${t.y}px)`
    })
    requestAnimationFrame(loop)
  })()
}
