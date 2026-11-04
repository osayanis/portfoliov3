// Démo OsaHUB : la fenêtre de l'app reproduite en HTML. On installe, on met à jour, on ouvre,
// au clic, avec ⌘K ou les chiffres 1, 2, 3. La mascotte dit où on en est. Rien n'est installé, évidemment.
const APPS = [
  { id: 'osanotch', name: 'OsaNotch', tag: 'Ton notch devient une Dynamic Island, avec une mascotte.', have: '1.0.7', last: '1.0.8' },
  { id: 'osawallpaper', name: 'OsaWallpaper', tag: 'Ton écran verrouillé prend les couleurs de ta musique.', have: null, last: '0.2.25' },
  { id: 'osaboot', name: 'OsaBoot', tag: 'Flasher une clé USB, même avec une ISO Windows.', have: '0.3.6', last: '0.3.6' },
  { id: 'osaweight', name: 'OsaWeight', tag: 'Une balance de cuisine dans le trackpad.', soon: true },
]
// étapes d'une installation : [part de la durée, ce qu'affiche la carte]
const STEPS = [[0.55, 'Téléchargement'], [0.25, 'Vérification de la signature'], [0.2, 'Installation']]

export default function hub(root, { sound, confetti }) {
  root.innerHTML = `
    <div class="hb">
      <div class="hb-win" tabindex="0" role="application" aria-label="Démo d'OsaHUB : ⌘K pour chercher, les chiffres 1 à 3 pour ouvrir une app">
        <div class="hb-bar"><i></i><i></i><i></i></div>
        <div class="hb-top">
          <p class="hb-logo"><span class="hb-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="hb-word">Osa<span>HUB</span></span></p>
          <button type="button" class="hb-search" aria-label="Rechercher"><span aria-hidden="true">⌕</span><span class="hb-slabel">Rechercher</span><kbd>⌘K</kbd></button>
        </div>
        <div class="hb-hero">
          <div class="hb-mascot" aria-hidden="true"><span class="hb-eyes"><i></i><i></i></span><span class="hb-mouth"></span></div>
          <div><p class="hb-title" aria-live="polite"></p><p class="hb-sub"></p></div>
          <button type="button" class="hb-pill hb-all">Tout mettre à jour</button>
        </div>
        <p class="hb-h">Les apps <span class="hb-count"></span></p>
        <div class="hb-grid"></div>
        <div class="hb-pal" hidden>
          <div class="hb-pbox">
            <input type="text" placeholder="Ouvrir, installer, mettre à jour…" aria-label="Recherche rapide" spellcheck="false">
            <div class="hb-plist" role="listbox"></div>
          </div>
        </div>
        <p class="hb-toast" aria-live="polite"></p>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const win = $('.hb-win'), grid = $('.hb-grid'), pal = $('.hb-pal'), input = $('.hb-pal input'), plist = $('.hb-plist')
  const st = Object.fromEntries(APPS.map(a => [a.id, { have: a.have, busy: 0, step: '', open: false }]))
  let mood = 'calm', palSel = 0, toastTimer = null

  const icon = a => `<img class="hb-icon" src="/media/osahub/icones/${a.id}.webp" alt="" width="44" height="44" loading="lazy">`
  const outdated = () => APPS.filter(a => !a.soon && st[a.id].have && st[a.id].have !== a.last)
  const working = () => APPS.some(a => st[a.id].busy)
  const installed = () => APPS.filter(a => st[a.id].have)
  const launchable = () => installed()

  function action(a) {
    const s = st[a.id]
    if (a.soon) return { label: 'Bientôt', off: true }
    if (s.busy) return { label: `${Math.round(s.busy * 100)} %`, off: true }
    if (!s.have) return { label: 'Installer', go: () => install(a) }
    if (s.have !== a.last) return { label: 'Mettre à jour', go: () => install(a) }
    return { label: s.open ? 'Quitter' : 'Ouvrir', go: () => toggle(a) }
  }

  function render() {
    const up = outdated()
    win.dataset.mood = working() ? 'busy' : mood
    $('.hb-title').textContent = working() ? 'Je m’en occupe…' : up.length ? `Bonjour, ${up.length > 1 ? `${up.length} mises à jour` : 'une mise à jour'}.` : mood === 'happy' ? 'C’est fait, tout est à jour.' : 'Bonjour, tout est à jour.'
    const open = APPS.filter(a => st[a.id].open).length
    $('.hb-sub').textContent = `${installed().length} apps installées${open ? ` · ${open} ouverte${open > 1 ? 's' : ''}` : ''}`
    $('.hb-all').hidden = !up.length || working()
    $('.hb-count').textContent = `${installed().length} sur ${APPS.length - 1} installées`
    grid.innerHTML = APPS.map((a, i) => {
      const s = st[a.id], act = action(a)
      const line = a.soon ? '<span class="hb-dim">Pas encore publiée</span>'
        : s.busy ? `<span class="hb-dim">${s.step}…</span>`
        : !s.have ? `<span class="hb-dim">v${a.last} disponible</span>`
        : s.have !== a.last ? `<span class="hb-new">v${s.have} → v${a.last}</span>`
        : `<span class="hb-ok">Installée · v${s.have}</span>`
      return `<div class="hb-card${a.soon ? ' soon' : ''}${s.open ? ' open' : ''}">
        ${icon(a)}
        <div class="hb-info"><b>${a.name}${s.open ? ' <span class="hb-on">Ouverte</span>' : ''}</b><small>${a.tag}</small><span class="hb-line">${line}</span>
          ${s.busy ? `<span class="hb-prog"><i style="width:${s.busy * 100}%"></i></span>` : ''}</div>
        <button type="button" class="hb-pill${act.off ? ' off' : ''}" data-act="${i}"${act.off ? ' disabled' : ''}>${act.label}</button>
        ${s.have && !a.soon ? `<kbd class="hb-kbd" aria-hidden="true">${launchable().indexOf(a) + 1}</kbd>` : ''}
      </div>`
    }).join('')
  }

  grid.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) action(APPS[+b.dataset.act]).go?.() })
  $('.hb-all').addEventListener('click', () => { outdated().forEach(install); sound.click(1.1) })

  function say(t) {
    const el = $('.hb-toast'); el.textContent = t; el.classList.add('show')
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200)
  }

  function install(a) {
    const s = st[a.id]
    if (s.busy || a.soon) return
    const wasOpen = s.open, t0 = performance.now(), total = 4200
    s.busy = 0.001; s.open = false; mood = 'calm'; sound.blip(900)
    const tick = () => {
      if (!root.isConnected) return
      const f = Math.min(1, (performance.now() - t0) / total)
      let acc = 0
      for (const [part, text] of STEPS) { acc += part; if (f <= acc + 1e-6) { s.step = text; break } }
      s.busy = Math.max(0.001, f)
      if (f < 1) { render(); return requestAnimationFrame(tick) }
      s.busy = 0; s.have = a.last; s.open = wasOpen
      if (!working()) { mood = 'happy'; confetti(); sound.blip(1500) }
      say(wasOpen ? `${a.name} est à jour, je l’ai relancée.` : `${a.name} v${a.last} est installée, signature vérifiée.`)
      render()
    }
    requestAnimationFrame(tick)
  }

  function toggle(a) {
    const s = st[a.id]
    s.open = !s.open; mood = 'calm'
    say(s.open ? `${a.name} s’ouvre.` : `${a.name} est fermée.`)
    sound.click(s.open ? 1.2 : 0.9)
    render()
  }

  /* ---------- ⌘K ---------- */
  const commands = () => [
    ...(outdated().length > 1 ? [{ t: 'Tout mettre à jour', run: () => outdated().forEach(install) }] : []),
    ...APPS.filter(a => !a.soon).map(a => { const act = action(a); return act.go ? { t: `${act.label} ${a.name}`, run: act.go } : null }).filter(Boolean),
  ]
  let shown = []
  function renderPal() {
    const q = input.value.trim().toLowerCase()
    shown = commands().filter(c => c.t.toLowerCase().includes(q))
    palSel = Math.min(palSel, Math.max(0, shown.length - 1))
    plist.innerHTML = shown.length
      ? shown.map((c, i) => `<button type="button" class="hb-pitem${i === palSel ? ' on' : ''}" data-cmd="${i}" role="option" aria-selected="${i === palSel}">${c.t}</button>`).join('')
      : '<p class="hb-dim">Rien ne correspond.</p>'
  }
  const openPal = () => { pal.hidden = false; input.value = ''; palSel = 0; renderPal(); input.focus(); sound.click(1.3) }
  const closePal = () => { pal.hidden = true; win.focus() }
  const runCmd = i => { const c = shown[i]; if (!c) return; closePal(); c.run() }
  $('.hb-search').addEventListener('click', openPal)
  input.addEventListener('input', () => { palSel = 0; renderPal() })
  plist.addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (b) runCmd(+b.dataset.cmd) })
  pal.addEventListener('click', e => { if (e.target === pal) closePal() })

  win.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); return pal.hidden ? openPal() : closePal() }
    if (!pal.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closePal() }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % Math.max(1, shown.length); renderPal() }
      else if (e.key === 'Enter') { e.preventDefault(); runCmd(palSel) }
      return
    }
    // ⌘1…⌘9 dans la vraie app ; ici le navigateur garde ⌘1…⌘9 pour ses onglets, donc les chiffres seuls marchent aussi
    if (/^[1-9]$/.test(e.key) && !e.altKey) {
      const a = launchable()[+e.key - 1]
      if (!a) return
      e.preventDefault()
      if (st[a.id].have !== a.last) return install(a)
      if (!st[a.id].open) toggle(a); else say(`${a.name} est déjà ouverte.`)
    }
  })

  render()
}
