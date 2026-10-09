import './style.css'
import { profile, heroKeys, osalabsApps, stack, timeline, method } from './data.js'
import { initGithub } from './github.js'

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

/* ================= SON ================= */
// Tout est synthétisé en WebAudio : pas de fichiers audio à charger.
const sound = (() => {
  let ctx = null
  let enabled = true
  try { enabled = localStorage.getItem('sound') !== 'off' } catch {}

  const ac = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  // "thock" de clavier mécanique : bruit filtré + petit corps grave
  function click(pitch = 1) {
    if (!enabled) return
    const a = ac(), t = a.currentTime
    const len = 0.06
    const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4)
    const noise = a.createBufferSource()
    noise.buffer = buf
    const bp = a.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2400 * pitch
    bp.Q.value = 0.9
    const ng = a.createGain()
    ng.gain.value = 0.35
    noise.connect(bp).connect(ng).connect(a.destination)
    noise.start(t)

    const osc = a.createOscillator()
    const og = a.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(190 * pitch, t)
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08)
    og.gain.setValueAtTime(0.4, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    osc.connect(og).connect(a.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  }

  // petite note de piano (deux oscillateurs + enveloppe)
  function note(freq, dur = 0.9) {
    if (!enabled) return
    const a = ac(), t = a.currentTime
    const g = a.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const lp = a.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(freq * 6, t)
    lp.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur)
    g.connect(lp).connect(a.destination)
    ;[['triangle', 1, 1], ['sine', 2, 0.35]].forEach(([type, mult, vol]) => {
      const o = a.createOscillator()
      const og = a.createGain()
      o.type = type
      o.frequency.value = freq * mult
      og.gain.value = vol
      o.connect(og).connect(g)
      o.start(t)
      o.stop(t + dur + 0.05)
    })
  }

  function blip(freq = 880) {
    if (!enabled) return
    const a = ac(), t = a.currentTime
    const o = a.createOscillator(), g = a.createGain()
    o.type = 'square'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.06, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    o.connect(g).connect(a.destination)
    o.start(t)
    o.stop(t + 0.08)
  }

  function chime() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => note(f, 0.7), i * 90))
  }

  const toggle = () => {
    enabled = !enabled
    try { localStorage.setItem('sound', enabled ? 'on' : 'off') } catch {}
    return enabled
  }
  return { click, note, blip, chime, toggle, get enabled() { return enabled } }
})()

const soundBtn = $('.sound-toggle')
soundBtn.setAttribute('aria-pressed', String(sound.enabled))
soundBtn.addEventListener('click', () => {
  soundBtn.setAttribute('aria-pressed', String(sound.toggle()))
  sound.click()
})

/* ================= TOAST + CONFETTIS ================= */
let toastTimer
function toast(msg) {
  const el = $('#toast')
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800)
}

function confetti() {
  if (reduceMotion) return
  const cv = $('#confetti'), cx = cv.getContext('2d')
  const dpr = Math.min(devicePixelRatio || 1, 2)
  cv.width = innerWidth * dpr
  cv.height = innerHeight * dpr
  cx.scale(dpr, dpr)
  const colors = heroKeys.map(k => k.c).concat('#fde68a', '#c2337a')
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.55,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 18 - 6,
    s: 7 + Math.random() * 9,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    c: colors[(Math.random() * colors.length) | 0],
  }))
  let frame = 0
  ;(function tick() {
    cx.clearRect(0, 0, innerWidth, innerHeight)
    parts.forEach(p => {
      p.vy += 0.42
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      cx.save()
      cx.translate(p.x, p.y)
      cx.rotate(p.r)
      cx.fillStyle = p.c
      cx.strokeStyle = '#161616'
      cx.lineWidth = 1.5
      cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7)
      cx.strokeRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7)
      cx.restore()
    })
    if (++frame < 220) requestAnimationFrame(tick)
    else cx.clearRect(0, 0, innerWidth, innerHeight)
  })()
}

/* ================= CLAVIER DU HERO ================= */
const keyboard = $('#keyboard')
const enterHit = $('.enter-hit')

heroKeys.forEach((k, i) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'key'
  b.dataset.letter = k.letter
  b.dataset.target = k.target
  b.style.cssText = `--x:${k.x};--y:${k.y};--c:${k.c};--d:${k.d};--i:${i};--r:${(i % 2 ? 1 : -1) * (4 + (i % 3) * 3)}deg`
  b.setAttribute('aria-label', `${k.letter} : ${k.label}`)
  b.innerHTML = `<span class="key-top"><span class="key-letter">${k.letter}</span><span class="key-label">${k.label}</span></span>`
  keyboard.insertBefore(b, enterHit)
})

const heroKeyEls = $$('.key', keyboard)

function pressVisual(el, ms = 140) {
  el.classList.add('down')
  setTimeout(() => el.classList.remove('down'), ms)
}
function pressEnter(ms = 160) {
  keyboard.classList.add('enter-down')
  setTimeout(() => keyboard.classList.remove('enter-down'), ms)
}
function go(target) {
  const el = $(target)
  if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

heroKeyEls.forEach((el, i) => {
  el.addEventListener('pointerdown', () => sound.click(0.9 + (i % 5) * 0.05))
  el.addEventListener('click', e => {
    // e.detail === 0 : activé au clavier (Entrée/Espace), on joue quand même le son
    if (e.detail === 0) { sound.click(); pressVisual(el) }
    setTimeout(() => go(el.dataset.target), 160)
  })
})
enterHit.addEventListener('pointerdown', () => { sound.click(0.7); keyboard.classList.add('enter-down') })
enterHit.addEventListener('pointerup', () => keyboard.classList.remove('enter-down'))
enterHit.addEventListener('pointerleave', () => keyboard.classList.remove('enter-down'))
enterHit.addEventListener('pointerenter', () => keyboard.classList.add('enter-hover'))
enterHit.addEventListener('pointerleave', () => keyboard.classList.remove('enter-hover'))
enterHit.addEventListener('click', e => {
  if (e.detail === 0) { sound.click(0.7); pressEnter() }
  setTimeout(() => go('#contact'), 160)
})

// Petite démo à l'arrivée : le clavier tape P-O-R-T-F-O-L-I-O tout seul
if (!reduceMotion) {
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  setTimeout(() => {
    order.forEach((idx, n) => setTimeout(() => pressVisual(heroKeyEls[idx], 120), n * 110))
    setTimeout(() => pressEnter(180), order.length * 110 + 120)
  }, 1700)
}

// Le vrai clavier fait bouger les touches. Et taper PORTFOLIO déclenche une surprise.
const SECRET = 'PORTFOLIO'
let typed = ''
const oCycle = { i: 0 }
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
  const tag = (e.target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea') return
  const ch = e.key.length === 1 ? e.key.toUpperCase() : e.key

  if (ch === 'Enter' && !e.target.closest('button, a')) { pressEnter(); sound.click(0.7) }

  const matches = heroKeyEls.filter(el => el.dataset.letter === ch)
  if (matches.length && !pianoActive) {
    const el = matches.length > 1 ? matches[oCycle.i++ % matches.length] : matches[0]
    pressVisual(el)
    sound.click(0.95 + Math.random() * 0.1)
  }

  if (/^[A-Z]$/.test(ch)) {
    typed = (typed + ch).slice(-SECRET.length)
    if (typed === SECRET) {
      typed = ''
      sound.chime()
      confetti()
      toast('🎉 Tu as tapé PORTFOLIO. Tu es officiellement quelqu\'un de curieux.')
      heroKeyEls.forEach((el, n) => setTimeout(() => pressVisual(el, 160), n * 70))
    }
  }
})

/* ================= NAV ================= */
const nav = $('.nav')
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true })

/* ================= REVEAL ================= */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in')
      io.unobserve(en.target)
    }
  })
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })

function onceVisible(el, cb, threshold = 0.35) {
  const o = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { cb(); o.disconnect() }
  }, { threshold })
  o.observe(el)
}

/* ================= MASCOTTES : les yeux suivent la souris ================= */
let mx = innerWidth / 2, my = innerHeight / 3, eyeRaf = 0
function updateEyes() {
  eyeRaf = 0
  $$('[data-mascot]').forEach(m => {
    const r = m.getBoundingClientRect()
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) return
    const dx = mx - (r.left + r.width / 2)
    const dy = my - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy) || 1
    const k = Math.min(1, d / 300)
    m.style.setProperty('--ex', `${(dx / d) * 60 * k}%`)
    m.style.setProperty('--ey', `${(dy / d) * 90 * k}%`)
    $$('.eye > i', m).forEach(p => {
      p.style.transform = `translate(${(dx / d) * 60 * k}%, ${(dy / d) * 110 * k}%)`
    })
  })
}
addEventListener('pointermove', e => {
  mx = e.clientX
  my = e.clientY
  if (!eyeRaf) eyeRaf = requestAnimationFrame(updateEyes)
}, { passive: true })

/* ================= OSANOTCH ================= */
const island = $('#island')
const tabs = $$('.island-tabs button')
function setIsland(state) {
  island.dataset.state = state
  island.classList.add('open')
  tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.state === state)))
  if (state === 'ai') sound.chime()
  requestAnimationFrame(updateEyes)
}
tabs.forEach(t => t.addEventListener('click', () => { sound.click(); setIsland(t.dataset.state) }))
island.addEventListener('click', () => { island.classList.toggle('open'); sound.click(1.1) })
onceVisible($('#mac'), () => setTimeout(() => island.classList.add('open'), 500), 0.5)

// Paroles qui défilent ligne par ligne
const lyricLines = $$('#lyrics p')
const lyricsBox = $('#lyrics')
const inner = document.createElement('div')
inner.className = 'lyrics-inner'
lyricLines.forEach(p => inner.appendChild(p))
lyricsBox.appendChild(inner)
let lyricIdx = 0
setInterval(() => {
  if (island.dataset.state !== 'music' || !island.classList.contains('open')) return
  lyricLines.forEach((p, i) => p.classList.toggle('on', i === lyricIdx))
  const lh = lyricLines[0].offsetHeight
  inner.style.transform = `translateY(${-Math.max(0, lyricIdx - 1) * lh}px)`
  lyricIdx = (lyricIdx + 1) % lyricLines.length
}, 2000)
lyricLines[0].classList.add('on')

/* ================= OSALABS ================= */
const visuals = {
  party: () => `<div class="v-party"><span class="v-pin">PIN 482 913</span>${'<i></i>'.repeat(7)}</div>`,
  drop: () => `<div class="v-drop"><div class="device laptop"></div><span class="packet"></span><div class="device"></div><span class="v-code">K7QX2M</span></div>`,
  cast: () => `<div class="v-cast"><div class="screen"><span class="ripple"></span></div><span class="live">● LIVE</span></div>`,
  board: () => `<div class="v-board"><svg viewBox="0 0 200 150"><path d="M20 110 C 40 40, 70 40, 80 90 S 120 140, 135 70 S 170 30, 182 60"/><path d="M30 40 L60 30 M120 115 Q150 100 175 118"/></svg></div>`,
}
$('#apps').innerHTML = osalabsApps.map((a, i) => `
  <a class="app reveal" href="${a.url}" target="_blank" rel="noopener" style="--c:${a.color};--d:${i * 0.08}s;--tilt:${i % 2 ? 1 : -1}deg">
    <div class="app-visual">${visuals[a.visual]()}</div>
    <div class="app-body">
      <span class="app-tag">${a.tag}</span>
      <h3>${a.name}<span aria-hidden="true">↗</span></h3>
      <p>${a.desc}</p>
      <p class="app-detail">${a.detail}</p>
      <div class="app-stack">${a.stack.map(s => `<span>${s}</span>`).join('')}</div>
    </div>
  </a>`).join('')

/* ================= CLAVIO : mini piano ================= */
const NOTES = [
  { n: 'Do', f: 261.63, code: 'KeyA' },
  { n: 'Do#', f: 277.18, code: 'KeyW', black: true },
  { n: 'Ré', f: 293.66, code: 'KeyS' },
  { n: 'Ré#', f: 311.13, code: 'KeyE', black: true },
  { n: 'Mi', f: 329.63, code: 'KeyD' },
  { n: 'Fa', f: 349.23, code: 'KeyF' },
  { n: 'Fa#', f: 369.99, code: 'KeyT', black: true },
  { n: 'Sol', f: 392.0, code: 'KeyG' },
  { n: 'Sol#', f: 415.3, code: 'KeyY', black: true },
  { n: 'La', f: 440.0, code: 'KeyH' },
  { n: 'La#', f: 466.16, code: 'KeyU', black: true },
  { n: 'Si', f: 493.88, code: 'KeyJ' },
  { n: 'Do', f: 523.25, code: 'KeyK' },
]
// Lettres affichées : AZERTY par défaut, remplacées par la vraie disposition si le navigateur la donne
const azerty = { KeyA: 'Q', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyK: 'K' }
const MELODY = [0, 0, 0, 2, 4, 2, 0, 4, 2, 2, 0] // indices dans NOTES : Au clair de la lune
const piano = $('#piano')
const whites = NOTES.map((n, i) => ({ ...n, i })).filter(n => !n.black)
const whiteW = 100 / whites.length
NOTES.forEach((n, i) => {
  const k = document.createElement('div')
  k.dataset.i = i
  if (n.black) {
    const prevWhites = NOTES.slice(0, i).filter(x => !x.black).length
    k.className = 'pk-black'
    k.style.left = `${prevWhites * whiteW}%`
  } else {
    k.className = 'pk-white'
    k.innerHTML = `${n.n}<small data-code="${n.code}">${azerty[n.code] || ''}</small>`
  }
  piano.appendChild(k)
})
navigator.keyboard?.getLayoutMap?.().then(map => {
  $$('small[data-code]', piano).forEach(s => {
    const l = map.get(s.dataset.code)
    if (l) s.textContent = l.toUpperCase()
  })
}).catch(() => {})

const pianoKeys = $$('[data-i]', piano)
let step = 0
const msg = $('#piano-msg'), bar = $('#piano-bar')
function showNext() {
  pianoKeys.forEach(k => k.classList.remove('next'))
  if (step < MELODY.length) pianoKeys[MELODY[step]].classList.add('next')
  bar.style.width = `${(step / MELODY.length) * 100}%`
}
function playKey(i) {
  const el = pianoKeys[i]
  sound.note(NOTES[i].f)
  pressVisual(el, 180)
  if (step >= MELODY.length) return
  if (i === MELODY[step]) {
    step++
    if (step === MELODY.length) {
      showNext()
      msg.innerHTML = '<b>Bravo !</b> Morceau terminé. Clavi est fier de toi. 🎉'
      setTimeout(() => { sound.chime(); confetti() }, 450)
      setTimeout(() => {
        step = 0
        msg.innerHTML = 'On recommence ? Suis la touche qui brille.'
        showNext()
      }, 4200)
      return
    }
    showNext()
  } else if (!NOTES[i].black) {
    el.classList.add('wrong')
    setTimeout(() => el.classList.remove('wrong'), 250)
  }
}
pianoKeys.forEach(k => k.addEventListener('pointerdown', e => { e.preventDefault(); playKey(+k.dataset.i) }))
showNext()

let pianoActive = false
new IntersectionObserver(([en]) => { pianoActive = en.isIntersecting }, { threshold: 0.6 }).observe($('.piano-card'))
document.addEventListener('keydown', e => {
  if (!pianoActive || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
  const i = NOTES.findIndex(n => n.code === e.code)
  if (i >= 0) { e.preventDefault(); playKey(i) }
})

/* ================= OPENPOD ================= */
const pod = $('#pod')
const podItems = $$('.pod-menu li', pod)
let podSel = 0
onceVisible(pod, () => setTimeout(() => { pod.classList.add('booted'); sound.blip(1320) }, 1200), 0.6)
$$('[data-pod]', pod).forEach(b => b.addEventListener('click', () => {
  if (!pod.classList.contains('booted')) pod.classList.add('booted')
  const a = b.dataset.pod
  if (a === 'up') podSel = (podSel - 1 + podItems.length) % podItems.length
  if (a === 'down') podSel = (podSel + 1) % podItems.length
  podItems.forEach((li, i) => li.classList.toggle('on', i === podSel))
  sound.blip(a === 'ok' ? 660 : 990)
  if (a === 'ok') toast(`OpenPod : « ${podItems[podSel].textContent} » arrive dans la phase 2 🎧`)
}))

/* ================= TERMINAL PROXMOX ================= */
const termLines = [
  ['$ ', 'c-dim'], ['sudo ./proxmox-auto.sh\n', ''],
  ['╭─ Automatisation Proxmox VE ─╮\n', 'c-acc'],
  ['  1) Créer des conteneurs (CT)\n  2) Créer des VM\n  3) Templates & ISOs\n', ''],
  ['> ', 'c-dim'], ['1\n', ''],
  ['Combien de CT ? ', ''], ['3\n', 'c-acc'],
  ['Template : ', ''], ['debian-12-standard\n', 'c-acc'],
  ['Stockage [local/local-lvm] : ', ''], ['local-lvm\n', 'c-acc'],
  ['IP de base : ', ''], ['192.168.1.110/24\n', 'c-acc'],
  ['✔ CT 110 créé · 192.168.1.110\n', 'c-ok'],
  ['✔ CT 111 créé · 192.168.1.111\n', 'c-ok'],
  ['✔ CT 112 créé · 192.168.1.112\n', 'c-ok'],
  ['3 conteneurs prêts en 41 s. ☕\n', ''],
]
const term = $('#term')
function typeTerminal() {
  term.innerHTML = ''
  const cursor = document.createElement('span')
  cursor.className = 'cursor'
  term.appendChild(cursor)
  let li = 0
  const next = () => {
    if (li >= termLines.length) { setTimeout(typeTerminal, 6000); return }
    const [text, cls] = termLines[li++]
    const span = document.createElement('span')
    if (cls) span.className = cls
    term.insertBefore(span, cursor)
    const typing = cls === 'c-acc' || text.startsWith('sudo') || /^\d\n$/.test(text)
    if (!typing || reduceMotion) { span.textContent = text; setTimeout(next, cls === 'c-ok' ? 380 : 140); return }
    let c = 0
    const t = setInterval(() => {
      span.textContent = text.slice(0, ++c)
      if (c >= text.length) { clearInterval(t); setTimeout(next, 260) }
    }, 42)
  }
  next()
}
onceVisible($('.terminal'), typeTerminal, 0.4)

/* ================= STATS ================= */
onceVisible($('#stats'), () => {
  $$('#stats dt').forEach(dt => {
    const target = +dt.dataset.count, suffix = dt.dataset.suffix || ''
    const t0 = performance.now(), dur = reduceMotion ? 1 : 1300
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur)
      dt.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : '')
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}, 0.5)

/* ================= MÉTHODE ================= */
const mColors = ['#f3a6cf', '#93c5fd', '#fde68a', '#a7e8bd']
$('#method').innerHTML = method.map((m, i) => `
  <li class="reveal" style="--c:${mColors[i]};--i:${i};--d:${i * 0.08}s">
    <div class="mk" aria-hidden="true">${m.key}</div>
    <h3><small>0${i + 1}</small>${m.name}</h3>
    <p>${m.text}</p>
  </li>`).join('')

/* ================= STACK ================= */
$('#keycaps').innerHTML = stack.map(s => `<button type="button" class="cap" style="--c:${s.c}"><span>${s.name}</span></button>`).join('')
$$('.cap').forEach((c, i) => c.addEventListener('pointerdown', () => sound.click(0.85 + (i % 6) * 0.06)))

/* ================= PARCOURS ================= */
const tColors = ['#f3a6cf', '#fcc48b', '#fde68a', '#93c5fd', '#c4b5fd']
$('#timeline').innerHTML = timeline.map((t, i) => `
  <li class="reveal" style="--c:${tColors[i]}">
    <span class="yr">${t.year}</span>
    <span class="pin" aria-hidden="true"></span>
    <div><h3>${t.title}</h3><p>${t.text}</p></div>
  </li>`).join('')
const tl = $('#timeline')
addEventListener('scroll', () => {
  const r = tl.getBoundingClientRect()
  const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height))
  tl.style.setProperty('--p', p.toFixed(3))
}, { passive: true })

/* ================= CONTACT ================= */
const mailBtn = $('#mail-btn')
if (profile.email) {
  mailBtn.href = `mailto:${profile.email}`
  mailBtn.removeAttribute('target')
}
mailBtn.addEventListener('pointerdown', () => sound.click(0.7))
$('#discord-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(profile.discord)
    toast(`Pseudo Discord copié : ${profile.discord}`)
  } catch {
    toast(`Mon Discord : ${profile.discord}`)
  }
  sound.click()
})

/* ================= GO ================= */
initGithub()
$$('.reveal').forEach(el => io.observe(el))
updateEyes()
