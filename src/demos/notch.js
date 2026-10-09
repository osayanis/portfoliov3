// Démo OsaNotch : l'île qui s'ouvre au survol, l'étagère à fichiers, le HUD volume
// et la détection de fin de génération d'une IA (3 relevés sans activité).
export default function notch(root, { sound, updateEyes }) {
  root.innerHTML = `
    <div class="nd">
      <div class="nd-screen">
        <div class="nd-menubar"><span class="nd-apple"></span><b>Finder</b><span>Fichier</span><span>Édition</span><span class="nd-r">jeu. 14:09</span></div>
        <div class="nd-island" data-state="music" tabindex="0" aria-label="Encoche OsaNotch : survole ou clique pour ouvrir">
          <div class="nd-mini"><span class="nd-mini-art"></span><span class="nd-eye-pair"><i></i><i></i></span><span class="nd-mini-eq"><i></i><i></i><i></i></span></div>
          <div class="nd-open">
            <nav class="nd-tabs">
              <button type="button" data-tab="music" class="on">Musique</button>
              <button type="button" data-tab="shelf">Étagère <em class="nd-count">0</em></button>
              <button type="button" data-tab="ai">IA</button>
            </nav>
            <div class="nd-pane" data-pane="music">
              <div class="nd-art"><span class="mascot" data-mascot><i class="eye"><i></i></i><i class="eye"><i></i></i></span></div>
              <div class="nd-player">
                <p class="nd-track"><b>Nuit blanche</b> · Démo OsaNotch</p>
                <div class="nd-lyrics"><div class="nd-lyrics-in">
                  <p>Je code jusqu'à pas d'heure</p><p>L'encoche danse avec moi</p><p>Un petit fantôme crème</p><p>Qui suit mon curseur du doigt</p><p>Et quand le build est vert</p><p>Il me fait coucou tout bas</p>
                </div></div>
                <div class="nd-bar"><i></i></div>
                <div class="nd-ctrl"><button type="button" data-a="prev" aria-label="Précédent">⏮</button><button type="button" data-a="play" aria-label="Pause">⏸</button><button type="button" data-a="next" aria-label="Suivant">⏭</button></div>
              </div>
            </div>
            <div class="nd-pane" data-pane="shelf"><div class="nd-shelf"><p class="nd-empty">Glisse un fichier sur l'encoche</p></div></div>
            <div class="nd-pane" data-pane="ai">
              <div class="nd-ai">
                <span class="mascot nd-ai-m" data-mascot><i class="eye"><i></i></i><i class="eye"><i></i></i></span>
                <div class="nd-ai-txt"><b>Aucune IA en cours</b><small>Lance une génération pour voir la détection.</small></div>
                <div class="nd-ticks" aria-hidden="true"><i></i><i></i><i></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="nd-hud" aria-hidden="true"><span>🔊</span><div><i></i></div></div>
        <div class="nd-wall"></div>
      </div>
      <div class="nd-controls">
        <div class="nd-files">
          <p>Fichiers à glisser sur l'encoche :</p>
          <button type="button" class="nd-file" data-name="maquette.png" data-c="#f3a6cf">🖼️ maquette.png</button>
          <button type="button" class="nd-file" data-name="rapport.pdf" data-c="#fca5a5">📄 rapport.pdf</button>
          <button type="button" class="nd-file" data-name="beat-v2.mp3" data-c="#86efac">🎵 beat-v2.mp3</button>
        </div>
        <label class="nd-vol">Volume <input type="range" min="0" max="100" value="60" aria-label="Volume" /></label>
        <button type="button" class="nd-gen btn">Lancer une génération IA</button>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const $$ = s => [...root.querySelectorAll(s)]
  const island = $('.nd-island')
  let pinned = false
  const open = () => { if (!island.classList.contains('open')) sound.click(1.15); island.classList.add('open'); requestAnimationFrame(updateEyes) }
  const close = () => { if (!pinned) island.classList.remove('open') }
  island.addEventListener('pointerenter', open)
  island.addEventListener('pointerleave', close)
  island.addEventListener('focus', open)
  island.addEventListener('blur', () => { pinned = false; close() })
  island.addEventListener('click', e => { if (!e.target.closest('button')) { pinned = !pinned; pinned ? open() : island.classList.remove('open') } })

  const setTab = t => {
    island.dataset.state = t
    $$('.nd-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t))
    requestAnimationFrame(updateEyes)
  }
  $$('.nd-tabs button').forEach(b => b.addEventListener('click', () => { sound.click(); setTab(b.dataset.tab) }))

  // paroles
  const lines = $$('.nd-lyrics p'), inner = $('.nd-lyrics-in')
  let li = 0, playing = true
  const tick = () => {
    if (!playing) return
    lines.forEach((p, i) => p.classList.toggle('on', i === li))
    inner.style.transform = `translateY(${-Math.max(0, li - 1) * lines[0].offsetHeight}px)`
    li = (li + 1) % lines.length
  }
  tick()
  setInterval(tick, 1900)
  $('[data-a="play"]').addEventListener('click', e => {
    playing = !playing
    e.currentTarget.textContent = playing ? '⏸' : '▶'
    root.querySelector('.nd').classList.toggle('paused', !playing)
    sound.click()
  })
  $$('[data-a="prev"], [data-a="next"]').forEach(b => b.addEventListener('click', () => { sound.click(); li = (li + (b.dataset.a === 'next' ? 1 : lines.length - 1)) % lines.length; const p = playing; playing = true; tick(); playing = p }))

  // étagère : glisser un fichier sur l'île (souris ou doigt), ou simple clic
  const shelf = $('.nd-shelf'), count = $('.nd-count')
  const addFile = (name, c) => {
    $('.nd-empty')?.remove()
    if ([...shelf.children].some(f => f.dataset.name === name)) return
    const f = document.createElement('div')
    f.className = 'nd-shelf-file'
    f.dataset.name = name
    f.innerHTML = `<span style="background:${c}"></span>${name}`
    shelf.appendChild(f)
    count.textContent = shelf.children.length
    open(); setTab('shelf')
    sound.chime()
  }
  $$('.nd-file').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault()
      const ghost = btn.cloneNode(true)
      ghost.classList.add('nd-ghost')
      document.body.appendChild(ghost)
      const move = ev => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const r = island.getBoundingClientRect(); island.classList.toggle('target', ev.clientX > r.left - 20 && ev.clientX < r.right + 20 && ev.clientY > r.top - 20 && ev.clientY < r.bottom + 30) }
      move(e)
      let moved = false
      const mv = ev => { moved = true; move(ev) }
      const up = ev => {
        removeEventListener('pointermove', mv); removeEventListener('pointerup', up)
        ghost.remove()
        const hit = island.classList.contains('target')
        island.classList.remove('target')
        if (hit || !moved) addFile(btn.dataset.name, btn.dataset.c)
      }
      addEventListener('pointermove', mv)
      addEventListener('pointerup', up)
    })
  })

  // HUD volume sous l'encoche
  const hud = $('.nd-hud'), hudBar = $('.nd-hud i')
  let hudT
  $('.nd-vol input').addEventListener('input', e => {
    hudBar.style.width = e.target.value + '%'
    hud.classList.add('show')
    clearTimeout(hudT)
    hudT = setTimeout(() => hud.classList.remove('show'), 1200)
  })

  // IA : génération, puis 3 relevés de 2 s sans signal avant de valider la fin
  const gen = $('.nd-gen'), txt = $('.nd-ai-txt'), ticks = $$('.nd-ticks i'), aiM = $('.nd-ai-m')
  gen.addEventListener('click', () => {
    if (gen.disabled) return
    gen.disabled = true
    sound.click()
    open(); setTab('ai'); pinned = true
    aiM.classList.remove('happy')
    ticks.forEach(t => t.className = '')
    txt.innerHTML = '<b>Assistant IA · génère…</b><small>Signal de génération détecté.</small>'
    root.querySelector('.nd').classList.add('busy')
    setTimeout(() => {
      txt.innerHTML = '<b>Plus de signal…</b><small>On attend 3 relevés de suite pour être sûr.</small>'
      ticks.forEach((t, i) => setTimeout(() => { t.className = 'on'; sound.blip(660 + i * 120) }, (i + 1) * 900))
      setTimeout(() => {
        root.querySelector('.nd').classList.remove('busy')
        aiM.classList.add('happy')
        txt.innerHTML = '<b>L\'assistant IA a terminé ✅</b><small>Validé après 3 relevés sans activité.</small>'
        sound.chime()
        gen.disabled = false
      }, 3 * 900 + 400)
    }, 2600)
  })
}
