// Démo OsaCast : la poignée de main WebRTC, étape par étape.
const STEPS = [
  { from: 'a', to: 'a', label: 'getDisplayMedia()', text: "Le diffuseur choisit ce qu'il partage : un écran, une fenêtre ou un onglet, son compris. Le navigateur demande l'autorisation." },
  { from: 'a', to: 's', label: 'join-room · K7QX2M', text: 'Le diffuseur crée une session. Le serveur lui attribue un code à partager.' },
  { from: 'b', to: 's', label: 'join-room · K7QX2M', text: 'Le spectateur tape le code ou scanne le QR code.' },
  { from: 's', to: 'a', label: 'peer-connected', text: "Le serveur prévient le diffuseur que quelqu'un est arrivé." },
  { from: 'a', to: 'b', via: 's', label: 'offre SDP', text: "Le diffuseur décrit ce qu'il propose : une piste vidéo, une piste audio, les formats qu'il sait encoder." },
  { from: 'b', to: 'a', via: 's', label: 'réponse SDP', text: 'Le spectateur répond avec ce qu\'il accepte. Les deux sont maintenant d\'accord sur le contenu.' },
  { from: 'a', to: 'b', via: 's', label: 'candidats ICE ⇄', both: true, text: "Chacun envoie les adresses où on peut le joindre, trouvées avec l'aide d'un serveur STUN." },
  { from: 'a', to: 'b', label: 'flux vidéo direct', direct: true, text: 'Une paire d\'adresses fonctionne : la vidéo part en direct. Le serveur ne voit jamais une seule image.' },
]

export default function handshake(root, { sound }) {
  root.innerHTML = `
    <div class="hs">
      <div class="hs-stage">
        <div class="hs-col" data-col="a"><div class="hs-head"><span class="hs-screen sharing"><i></i><i></i><i></i></span><b>Diffuseur</b></div><div class="hs-life"></div></div>
        <div class="hs-col" data-col="s"><div class="hs-head"><span class="hs-srv">⚙︎</span><b>Serveur</b></div><div class="hs-life"></div></div>
        <div class="hs-col" data-col="b"><div class="hs-head"><span class="hs-screen viewer"><i></i><i></i><i></i></span><b>Spectateur</b></div><div class="hs-life"></div></div>
        <svg class="hs-arrows" preserveAspectRatio="none"></svg>
      </div>
      <div class="hs-panel">
        <p class="hs-count">Étape <b>0</b> / ${STEPS.length}</p>
        <p class="hs-text">Appuie sur « Étape suivante » pour lancer la connexion.</p>
        <div class="hs-btns">
          <button type="button" class="btn btn-dark hs-next">Étape suivante →</button>
          <button type="button" class="btn hs-auto">Lecture auto</button>
          <button type="button" class="btn hs-reset">Recommencer</button>
        </div>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const svg = $('.hs-arrows'), stage = $('.hs-stage')
  let i = 0, auto = null

  const colX = id => {
    const c = root.querySelector(`[data-col="${id}"]`).getBoundingClientRect(), s = stage.getBoundingClientRect()
    return c.left - s.left + c.width / 2
  }

  function draw() {
    const s = stage.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`)
    const top = 96, gap = Math.max(34, (s.height - top - 20) / STEPS.length)
    svg.innerHTML = `<defs><marker id="hs-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>` +
      STEPS.slice(0, i).map((st, k) => {
        const y = top + k * gap, last = k === i - 1
        const x1 = colX(st.from), x2 = colX(st.to)
        if (st.from === st.to) {
          return `<g class="hs-msg ${last ? 'last' : ''}"><path d="M${x1} ${y - 8} h34 v16 h-34" marker-end="url(#hs-a)"/><text x="${x1 + 44}" y="${y + 4}">${st.label}</text></g>`
        }
        const cls = `hs-msg ${last ? 'last' : ''} ${st.direct ? 'direct' : ''} ${st.via ? 'via' : ''}`
        const mid = (x1 + x2) / 2
        return `<g class="${cls}"><path d="M${x1} ${y} L${x2} ${y}" marker-end="url(#hs-a)" ${st.both ? 'marker-start="url(#hs-a)"' : ''}/>
          <rect x="${mid - st.label.length * 3.7 - 10}" y="${y - 22}" width="${st.label.length * 7.4 + 20}" height="20" rx="10"/><text x="${mid}" y="${y - 8}" text-anchor="middle">${st.label}</text></g>`
      }).join('')
    root.querySelector('.hs').classList.toggle('live', i === STEPS.length)
  }

  function step() {
    if (i >= STEPS.length) return stop()
    i++
    $('.hs-count b').textContent = i
    $('.hs-text').textContent = STEPS[i - 1].text
    sound.blip(500 + i * 70)
    if (i === STEPS.length) { sound.chime(); stop() }
    draw()
  }
  function stop() { clearInterval(auto); auto = null; $('.hs-auto').textContent = 'Lecture auto' }

  $('.hs-next').addEventListener('click', step)
  $('.hs-auto').addEventListener('click', () => {
    if (auto) return stop()
    if (i >= STEPS.length) i = 0
    $('.hs-auto').textContent = 'Pause'
    step()
    auto = setInterval(step, 1800)
  })
  $('.hs-reset').addEventListener('click', () => { stop(); i = 0; $('.hs-count b').textContent = 0; $('.hs-text').textContent = 'Appuie sur « Étape suivante » pour lancer la connexion.'; draw(); sound.click() })
  addEventListener('resize', draw)
  draw()
}
