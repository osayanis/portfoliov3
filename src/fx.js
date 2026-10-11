// Effets partagés par toutes les pages : cartes qui s'inclinent en 3D avec un reflet,
// barre de progression de lecture, compteurs animés, objets flottants en parallaxe.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

/* ---------- cartes inclinables ---------- */
export function tilt(selector, { max = 8, lift = 6, scale = 1 } = {}) {
  if (reduce || !finePointer) return
  document.querySelectorAll(selector).forEach(el => {
    if (el.dataset.tiltReady) return
    el.dataset.tiltReady = '1'
    el.classList.add('tilt')
    const m = +(el.dataset.tiltMax || max)
    const glare = document.createElement('span')
    glare.className = 'tilt-glare'
    glare.setAttribute('aria-hidden', 'true')
    el.appendChild(glare)
    let raf = 0, tx = 0, ty = 0
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width
      ty = (e.clientY - r.top) / r.height
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        el.style.transform = `perspective(900px) rotateX(${(0.5 - ty) * m}deg) rotateY(${(tx - 0.5) * m}deg) translateY(-${lift}px) scale(${scale})`
        el.style.setProperty('--gx', tx * 100 + '%')
        el.style.setProperty('--gy', ty * 100 + '%')
      })
    })
    el.addEventListener('pointerenter', () => el.classList.add('tilting'))
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf); raf = 0
      el.classList.remove('tilting')
      el.style.transform = ''
    })
  })
}

/* ---------- barre de progression ---------- */
export function progressBar() {
  const bar = document.createElement('div')
  bar.className = 'read-progress'
  bar.setAttribute('aria-hidden', 'true')
  document.body.appendChild(bar)
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
  }
  addEventListener('scroll', update, { passive: true })
  addEventListener('resize', update)
  update()
}

/* ---------- compteurs : « 4 379 » monte de 0 à 4 379 ---------- */
export function countUp(selector) {
  const els = [...document.querySelectorAll(selector)]
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return
    io.unobserve(en.target)
    const el = en.target
    const m = el.textContent.match(/^([^\d]*)(\d(?:[\d\s\u202f\u00a0]*\d)?)(.*)$/)
    if (!m || reduce) return
    const target = +m[2].replace(/\D/g, '')
    const t0 = performance.now(), dur = 1200
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur)
      el.textContent = m[1] + Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('fr-FR') + m[3]
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), { threshold: 0.6 })
  els.forEach(el => io.observe(el))
}

/* ---------- objets 3D flottants qui suivent la souris ---------- */
export function parallax(selector) {
  const els = [...document.querySelectorAll(selector)]
  if (!els.length || reduce) return
  let mx = 0, my = 0, cx = 0, cy = 0, sy = scrollY
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }, { passive: true })
  addEventListener('scroll', () => { sy = scrollY }, { passive: true })
  ;(function loop() {
    cx += (mx - cx) * 0.06
    cy += (my - cy) * 0.06
    els.forEach(el => {
      const d = +(el.dataset.depth || 1)
      el.style.setProperty('--px', `${cx * 60 * d}px`)
      el.style.setProperty('--py', `${cy * 60 * d - sy * 0.12 * d}px`)
    })
    requestAnimationFrame(loop)
  })()
}

/* ---------- boutons légèrement aimantés ---------- */
export function magnetic(selector) {
  if (reduce || !finePointer) return
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect()
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`
    })
    el.addEventListener('pointerleave', () => { el.style.translate = '' })
  })
}

/* ---------- titres : chaque mot bascule en 3D à l'apparition ---------- */
export function splitWords(selector) {
  if (reduce) return
  document.querySelectorAll(selector).forEach(h => {
    if (h.dataset.split) return
    h.dataset.split = '1'
    let i = 0
    const wrap = node => {
      const s = document.createElement('span')
      s.className = 'w'
      s.style.setProperty('--wi', i++)
      return s
    }
    ;[...h.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return }
          const s = wrap(); s.textContent = part; frag.appendChild(s)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1) {
        const s = wrap(); n.replaceWith(s); s.appendChild(n)
      }
    })
  })
}
