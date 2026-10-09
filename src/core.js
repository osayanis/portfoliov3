// Briques partagées par l'accueil et les pages projet : son, toast, confettis, apparitions, mascottes.
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
if (soundBtn) {
soundBtn.setAttribute('aria-pressed', String(sound.enabled))
soundBtn.addEventListener('click', () => {
  soundBtn.setAttribute('aria-pressed', String(sound.toggle()))
  sound.click()
})
}

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
  const colors = ['#f3a6cf', '#c4b5fd', '#a7e8bd', '#fcc48b', '#93c5fd', '#f9a8a8', '#fde68a', '#a5b4fc', '#86efac', '#c2337a']
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

/* ================= NAV ================= */
const nav = $('.nav')
if (nav) addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true })

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

export function observeReveals(root = document) {
  $$('.reveal', root).forEach(el => io.observe(el))
}

export { $, $$, reduceMotion, sound, toast, confetti, io, onceVisible, updateEyes }
