// Démo OsaWallpaper : l'écran verrouillé reproduit en HTML. On change de fond, on lance la
// musique, on passe du fondu (le bas laisse voir le fond de macOS) au plein écran.
const BGS = [
  { id: 'lofoten', name: 'Aurore boréale', src: '/media/osawallpaper/bg-lofoten.webp' },
  { id: 'matterhorn', name: 'Cervin', src: '/media/osawallpaper/bg-matterhorn.webp' },
  { id: 'namib', name: 'Désert du Namib', src: '/media/osawallpaper/bg-namib.webp' },
]
// paroles inventées pour la démo, une ligne toutes les 3 s
const LYRICS = ['On roule sans savoir où', 'La ville s’allume pour nous', 'Encore une nuit d’été', 'Et le ciel ne veut pas finir', '♪']
const LENGTH = 210

export default function lock(root, { sound }) {
  root.innerHTML = `
    <div class="wl">
      <div class="wl-screen" data-mode="fade">
        <img class="wl-bg" alt="" src="${BGS[0].src}">
        <div class="wl-art-bg" aria-hidden="true"></div>
        <div class="wl-fade" aria-hidden="true"></div>
        <div class="wl-top"><span class="wl-date"></span><span>☁︎ 14°</span><span>⚡︎ 82 %</span></div>
        <div class="wl-clock"></div>
        <div class="wl-music" hidden>
          <div class="wl-cover" aria-hidden="true"><i></i><b></b></div>
          <p class="wl-lyric"></p>
          <div class="wl-player">
            <div class="wl-title"><b>Nuit d’été</b><small>Les Osa</small></div>
            <div class="wl-prog"><span class="wl-t0">0:00</span><i><em></em></i><span class="wl-t1">-3:30</span></div>
            <div class="wl-ctl" aria-hidden="true"><span>⏮</span><span class="wl-pp">❚❚</span><span>⏭</span></div>
          </div>
        </div>
        <div class="wl-login"><span class="wl-av" aria-hidden="true"></span><b>Toi</b><span class="wl-pass">Saisir le mot de passe</span></div>
      </div>
      <div class="wl-ctrls">
        <div class="wl-group" role="group" aria-label="Fond d'écran">${BGS.map((b, i) => `<button type="button" class="wl-chip${i ? '' : ' on'}" data-bg="${i}"><img src="${b.src}" alt="">${b.name}</button>`).join('')}</div>
        <div class="wl-group" role="group" aria-label="Affichage">
          <button type="button" class="wl-chip on" data-mode="fade">Fondu en bas</button>
          <button type="button" class="wl-chip" data-mode="full">Plein écran</button>
        </div>
        <button type="button" class="wl-chip wl-play" aria-pressed="false">▶︎ Lancer la musique</button>
      </div>
      <p class="wl-note"></p>
    </div>`

  const $ = s => root.querySelector(s)
  const $$ = s => [...root.querySelectorAll(s)]
  const screen = $('.wl-screen'), music = $('.wl-music'), note = $('.wl-note')
  let playing = false, pos = 64, last = performance.now(), acc = 1

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  function explain() {
    const full = screen.dataset.mode === 'full'
    note.textContent = playing
      ? (full ? 'Plein écran : la pochette couvre tout, et devient le fond de macOS le temps du verrouillage. Seul le champ du mot de passe reste à macOS.'
        : 'Fondu : la pochette floutée en haut, le fond de macOS en bas. La ligne de paroles suit le morceau.')
      : (full ? 'Plein écran : ta photo partout, macOS ne garde que le champ du mot de passe.'
        : 'Fondu : ta photo en haut, le fond de macOS en bas, là où macOS dessine la connexion.')
  }

  $$('[data-bg]').forEach(b => b.addEventListener('click', () => {
    $$('[data-bg]').forEach(x => x.classList.toggle('on', x === b))
    $('.wl-bg').src = BGS[+b.dataset.bg].src
    sound.click(1.1)
  }))
  $$('.wl-ctrls [data-mode]').forEach(b => b.addEventListener('click', () => {
    $$('.wl-ctrls [data-mode]').forEach(x => x.classList.toggle('on', x === b))
    screen.dataset.mode = b.dataset.mode
    sound.click(1)
    explain()
  }))
  $('.wl-play').addEventListener('click', e => {
    playing = !playing
    e.currentTarget.setAttribute('aria-pressed', playing)
    e.currentTarget.textContent = playing ? '❚❚ Couper la musique' : '▶︎ Lancer la musique'
    music.hidden = !playing
    screen.classList.toggle('playing', playing)
    sound.blip(playing ? 1400 : 900)
    explain()
  })

  let lyric = -1
  function tick(now) {
    if (!root.isConnected) return
    const dt = (now - last) / 1000; last = now
    if (playing) pos = (pos + dt) % LENGTH
    acc += dt
    if (acc < 0.25) { requestAnimationFrame(tick); return }
    acc = 0
    const d = new Date()
    const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    $('.wl-date').textContent = day.charAt(0).toUpperCase() + day.slice(1)
    $('.wl-clock').textContent = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    $('.wl-prog em').style.width = `${(pos / LENGTH) * 100}%`
    $('.wl-t0').textContent = fmt(pos)
    $('.wl-t1').textContent = `-${fmt(LENGTH - pos)}`
    const k = Math.floor(pos / 3) % LYRICS.length
    if (k !== lyric) {
      lyric = k
      const p = $('.wl-lyric')
      p.textContent = LYRICS[k]
      p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop')
    }
    requestAnimationFrame(tick)
  }
  explain()
  requestAnimationFrame(tick)
}
