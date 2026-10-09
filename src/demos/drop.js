// Démo OsaDrop : simulation du vrai algorithme d'envoi.
// Morceaux de 64 Ko, pause dès que le tampon du DataChannel dépasse 1 Mo.
// Sans ce contrôle, la file grossit jusqu'à 16 Mo et le navigateur coupe le canal.
const MB = 1024 * 1024
const CHUNK = 64 * 1024
const THRESHOLD = 1 * MB
const MAX_QUEUE = 16 * MB
const CPU = 400 * MB // vitesse à laquelle le navigateur sait découper le fichier

export default function drop(root, { sound, confetti }) {
  root.innerHTML = `
    <div class="dd">
      <div class="dd-controls">
        <div class="dd-seg" role="radiogroup" aria-label="Taille du fichier">
          <button type="button" data-size="8">8 Mo</button>
          <button type="button" data-size="64" class="on">64 Mo</button>
          <button type="button" data-size="256">256 Mo</button>
        </div>
        <label class="dd-speed">Réseau <input type="range" min="2" max="80" value="12" /> <b>12 Mo/s</b></label>
        <label class="dd-check"><input type="checkbox" checked /> Contrôle de débit</label>
        <button type="button" class="btn btn-dark dd-go">Envoyer</button>
      </div>
      <div class="dd-stage">
        <div class="dd-dev"><span class="dd-file">📦</span><b>Expéditeur</b><small class="dd-name">video.mp4 · 64 Mo</small></div>
        <div class="dd-pipe"><div class="dd-lane"></div><span class="dd-state">Prêt</span></div>
        <div class="dd-dev"><span class="dd-ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16"/><circle class="dd-ring-p" cx="20" cy="20" r="16"/></svg><em>0%</em></span><b>Destinataire</b><small class="dd-recv">0 Mo reçus</small></div>
      </div>
      <div class="dd-buffer">
        <div class="dd-buf-head"><span>Tampon du DataChannel <code>bufferedAmount</code></span><b class="dd-buf-v">0 Ko</b></div>
        <div class="dd-gauge"><i class="dd-fill"></i><span class="dd-mark" title="Seuil : 1 Mo"></span></div>
        <div class="dd-scale"><span>0</span><span>1 Mo · pause</span><span>4 Mo</span></div>
      </div>
      <dl class="dd-stats">
        <div><dt>Morceaux envoyés</dt><dd class="dd-chunks">0 / 1 024</dd></div>
        <div><dt>Débit</dt><dd class="dd-rate">0 Mo/s</dd></div>
        <div><dt>Pic du tampon</dt><dd class="dd-pauses">0 Ko</dd></div>
        <div><dt>Temps</dt><dd class="dd-time">0,0 s</dd></div>
      </dl>
    </div>`

  const $ = s => root.querySelector(s)
  let sizeMB = 64, speed = 12 * MB, running = false
  const speedIn = $('.dd-speed input'), speedOut = $('.dd-speed b'), flow = $('.dd-check input')
  const lane = $('.dd-lane'), state = $('.dd-state'), go = $('.dd-go')
  const ringP = $('.dd-ring-p'), ringT = $('.dd-ring em')
  const fmt = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

  root.querySelectorAll('.dd-seg button').forEach(b => b.addEventListener('click', () => {
    if (running) return
    sound.click()
    root.querySelectorAll('.dd-seg button').forEach(x => x.classList.toggle('on', x === b))
    sizeMB = +b.dataset.size
    $('.dd-name').textContent = `video.mp4 · ${sizeMB} Mo`
    $('.dd-chunks').textContent = `0 / ${(sizeMB * MB / CHUNK).toLocaleString('fr-FR')}`
  }))
  speedIn.addEventListener('input', () => { speed = +speedIn.value * MB; speedOut.textContent = speedIn.value + ' Mo/s' })

  function setState(t, cls = '') { state.textContent = t; state.className = 'dd-state ' + cls }

  go.addEventListener('click', () => {
    if (running) return
    running = true
    go.disabled = true
    sound.click()
    const total = sizeMB * MB, chunks = total / CHUNK
    let queued = 0, buffer = 0, received = 0, peak = 0, t0 = performance.now(), last = t0, spawn = 0
    root.querySelector('.dd').classList.remove('done', 'error')

    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // 1. l'expéditeur découpe et met en file, sauf si le tampon est plein
      const canSend = !flow.checked || buffer <= THRESHOLD
      if (canSend && queued < total) {
        // avec le contrôle, on n'envoie qu'un morceau de plus que ce que le seuil autorise
        const room = flow.checked ? Math.max(CHUNK, THRESHOLD + CHUNK - buffer) : Infinity
        const n = Math.min(Math.ceil(CPU * dt / CHUNK) * CHUNK, total - queued, Math.floor(room / CHUNK) * CHUNK)
        queued += n
        buffer += n
      }
      peak = Math.max(peak, buffer)
      // 2. le réseau vide le tampon à sa vitesse
      const out = Math.min(buffer, speed * dt)
      buffer -= out
      received += out
      // 3. des petits morceaux à l'écran, proportionnels au débit
      spawn += out / MB
      while (spawn > Math.max(0.4, speed / MB / 14)) {
        spawn -= Math.max(0.4, speed / MB / 14)
        const c = document.createElement('i')
        c.style.top = 20 + Math.random() * 60 + '%'
        c.style.animationDuration = Math.max(0.5, 2.4 - speed / MB / 40) + 's'
        lane.appendChild(c)
        setTimeout(() => c.remove(), 2600)
      }

      const pct = received / total
      ringP.style.strokeDashoffset = 100.5 * (1 - pct)
      ringT.textContent = Math.floor(pct * 100) + '%'
      $('.dd-recv').textContent = `${fmt(received / MB)} Mo reçus`
      const shown = Math.min(buffer, 4 * MB)
      $('.dd-fill').style.width = (shown / (4 * MB)) * 100 + '%'
      $('.dd-gauge').classList.toggle('over', buffer > THRESHOLD)
      $('.dd-buf-v').textContent = buffer >= MB ? fmt(buffer / MB) + ' Mo' : Math.round(buffer / 1024) + ' Ko'
      $('.dd-chunks').textContent = `${Math.round(queued / CHUNK).toLocaleString('fr-FR')} / ${chunks.toLocaleString('fr-FR')}`
      $('.dd-rate').textContent = `${fmt(out / dt / MB || 0)} Mo/s`
      $('.dd-pauses').textContent = peak >= MB ? fmt(peak / MB) + ' Mo' : Math.round(peak / 1024) + ' Ko'
      $('.dd-time').textContent = fmt((now - t0) / 1000) + ' s'

      if (!flow.checked && buffer > MAX_QUEUE) {
        setState('Erreur : la file dépasse 16 Mo, le navigateur coupe le canal', 'bad')
        root.querySelector('.dd').classList.add('error')
        sound.blip(180)
        running = false; go.disabled = false
        return
      }
      if (received >= total) {
        setState('Fichier reçu et reconstitué ✓', 'ok')
        root.querySelector('.dd').classList.add('done')
        $('.dd-fill').style.width = '0%'
        sound.chime(); confetti()
        running = false; go.disabled = false
        return
      }
      setState(flow.checked ? "Envoi régulé : on attend que le tampon redescende sous 1 Mo" : 'Envoi sans limite : la file grossit…', flow.checked ? '' : 'wait')
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
}
