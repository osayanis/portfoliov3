import './style.css'
import './project.css'
import './demos/demos.css'
import './cs-bureau.css'
import { $, $$, sound, toast, confetti, onceVisible, updateEyes, observeReveals } from './core.js'
import { tilt, progressBar, countUp, parallax, magnetic, splitWords } from './fx.js'

const demos = import.meta.glob('./demos/*.js')

/* La grosse touche du hero : elle s'enfonce et fait "thock" */
const key = $('.cs-key')
if (key) {
  key.addEventListener('pointerdown', () => { key.classList.add('down'); sound.click(0.8) })
  const up = () => key.classList.remove('down')
  key.addEventListener('pointerup', up)
  key.addEventListener('pointerleave', up)
}

/* Flèches ← → : projet précédent / suivant */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
  if (e.target.closest('input, textarea, [contenteditable], .demo')) return
  const link = $(`.pager-key[data-key="${e.key}"]`)
  if (!link) return
  link.classList.add('down')
  sound.click(0.9)
  setTimeout(() => { location.href = link.href }, 140)
})
$$('.pager-key').forEach(a => a.addEventListener('pointerdown', () => sound.click(0.9)))

/* Captures : clic pour agrandir */
const zoom = $('#zoom')
$$('[data-zoom]').forEach(b => b.addEventListener('click', () => {
  $('img', zoom).src = b.dataset.zoom
  $('img', zoom).alt = $('img', b).alt
  zoom.showModal()
}))
zoom?.addEventListener('click', e => { if (e.target === zoom || e.target.closest('button')) zoom.close() })

/* Démo : chargée seulement quand elle approche de l'écran */
const demoEl = $('[data-demo]')
if (demoEl) {
  const loader = demos[`./demos/${demoEl.dataset.demo}.js`]
  if (loader) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      io.disconnect()
      loader().then(m => {
        demoEl.innerHTML = ''
        m.default(demoEl, { sound, toast, confetti, onceVisible, updateEyes })
      })
    }, { rootMargin: '400px' })
    io.observe(demoEl)
  }
}

splitWords('.cs-head h2, .cs-next-card h2')
observeReveals()

/* Effets 3D */
progressBar()
countUp('.cs-stat b')
parallax('.cs-floaters .cube, .cs-floaters .orb')
magnetic('.btn, .cs-back')
tilt('.cs-cap', { max: 26, lift: 0 })
tilt('.cs-stat', { max: 12, lift: 4 })
tilt('.challenge', { max: 6, lift: 4 })
tilt('.frame-browser, .frame-shot, .frame-image, .frame-phone', { max: 7, lift: 6 })
tilt('.pager-key', { max: 8, lift: 3 })
