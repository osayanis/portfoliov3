// Démo OsaBoot : la fenêtre de l'app reproduite en HTML. On choisit une image et une clé,
// on confirme, et la mascotte raconte chaque étape pendant que la clé se remplit. Rien n'est écrit.
const IMAGES = [
  { id: 'ubuntu', name: 'Ubuntu 24.04', file: 'ubuntu-24.04-desktop.iso', size: 6.1, win: false },
  { id: 'pi', name: 'Raspberry Pi OS', file: 'raspios-bookworm.img', size: 5.4, win: false },
  { id: 'win', name: 'Windows 11', file: 'Win11_25H2_French_x64.iso', size: 7.3, win: true },
]
const KEYS = [{ id: 32, name: 'SanDisk Ultra', size: 32 }, { id: 4, name: 'Vieille clé', size: 4 }]
// étapes : [part de la durée, ce que dit la mascotte]
const RAW = [[0.55, "J'écris l'image sur la clé…"], [0.4, 'Je relis tout pour être sûr…'], [0.05, "J'éjecte la clé…"]]
const WIN = [[0.08, 'Je prépare la clé en FAT32…'], [0.5, 'Je copie les fichiers de Windows…'], [0.32, 'install.wim est trop gros pour FAT32 : je le coupe en morceaux…'], [0.1, 'Je range les derniers fichiers…']]

export default function flash(root, { sound, confetti }) {
  root.innerHTML = `
    <div class="fb">
      <div class="fb-win" data-state="idle">
        <div class="fb-bar"><i></i><i></i><i></i><b>OsaBoot</b></div>
        <div class="fb-stage">
          <div class="fb-slot">
            <div class="fb-disc"><span class="fb-hub"></span></div>
            <b class="fb-iname"></b><small class="fb-isub"></small>
          </div>
          <div class="fb-flow" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="fb-mid">
            <p class="fb-bubble" aria-live="polite"></p>
            <div class="fb-mascot" aria-hidden="true"><span class="fb-eyes"><i></i><i></i></span><span class="fb-mouth"></span></div>
          </div>
          <div class="fb-flow" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="fb-slot">
            <div class="fb-key"><span class="fb-plug"></span><span class="fb-body"><em></em><b class="fb-pct"></b></span></div>
            <b class="fb-kname"></b><small class="fb-ksub"></small>
          </div>
        </div>
        <div class="fb-bottom">
          <div class="fb-prog"><i><em></em></i></div>
          <button type="button" class="fb-go">⚡︎ Flasher</button>
        </div>
        <div class="fb-confirm" hidden>
          <div class="fb-card">
            <p class="fb-ctitle"></p>
            <p class="fb-ctext"></p>
            <div><button type="button" class="fb-no">Annuler</button><button type="button" class="fb-yes">Effacer et flasher</button></div>
          </div>
        </div>
      </div>
      <div class="fb-ctrls">
        <div class="wl-group" role="group" aria-label="Image">${IMAGES.map((m, i) => `<button type="button" class="wl-chip${i === 2 ? ' on' : ''}" data-img="${i}">${m.name}</button>`).join('')}</div>
        <div class="wl-group" role="group" aria-label="Clé">${KEYS.map((k, i) => `<button type="button" class="wl-chip${i ? '' : ' on'}" data-key="${i}">${k.name} · ${k.size} Go</button>`).join('')}</div>
      </div>
    </div>`

  const $ = s => root.querySelector(s)
  const $$ = s => [...root.querySelectorAll(s)]
  const win = $('.fb-win'), bubble = $('.fb-bubble')
  let img = IMAGES[2], key = KEYS[0], timer = null

  const say = t => { if (bubble.textContent === t) return; bubble.textContent = t; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop') }
  const set = state => { win.dataset.state = state }
  const tooSmall = () => key.size < img.size + 0.1

  function render() {
    $('.fb-iname').textContent = img.file
    $('.fb-isub').textContent = `${img.win ? 'Windows x64' : 'Image disque'} · ${String(img.size).replace('.', ',')} Go`
    $('.fb-disc').classList.toggle('win', img.win)
    $('.fb-kname').textContent = key.name
    $('.fb-ksub').textContent = `USB · ${key.size} Go`
    win.classList.toggle('bad', tooSmall())
    $('.fb-go').disabled = tooSmall()
    $('.fb-pct').textContent = `${key.size} Go`
    if (tooSmall()) return say(`« ${key.name} » est trop petite : il faut au moins ${Math.ceil(img.size)} Go.`)
    say(img.win ? `Je prépare « ${key.name} » en FAT32 et j'y mets Windows. On y va ?` : `Je copie l'image sur « ${key.name} », puis je vérifie tout. On y va ?`)
  }

  function pick(attr, list, i) {
    if (win.dataset.state === 'run') return
    $$(`[data-${attr}]`).forEach(b => b.classList.toggle('on', +b.dataset[attr] === i))
    if (attr === 'img') img = list[i]; else key = list[i]
    set('idle'); setFill(0); $('.fb-go').textContent = '⚡︎ Flasher'
    win.classList.remove('hop'); void win.offsetWidth; win.classList.add('hop')
    sound.click(1.1)
    render()
  }
  $$('[data-img]').forEach(b => b.addEventListener('click', () => pick('img', IMAGES, +b.dataset.img)))
  $$('[data-key]').forEach(b => b.addEventListener('click', () => pick('key', KEYS, +b.dataset.key)))

  function setFill(f) {
    $('.fb-body em').style.height = `${f * 100}%`
    $('.fb-prog em').style.width = `${f * 100}%`
    if (f > 0) $('.fb-pct').textContent = `${Math.round(f * 100)} %`
  }

  $('.fb-go').addEventListener('click', () => {
    if (win.dataset.state === 'done') { set('idle'); setFill(0); render(); $('.fb-go').textContent = '⚡︎ Flasher'; return }
    $('.fb-ctitle').textContent = `On efface « ${key.name} » ?`
    $('.fb-ctext').textContent = `Tout ce qu'elle contient (${key.size} Go) va disparaître.`
    $('.fb-confirm').hidden = false
    set('confirm'); say('Attends, je vérifie que c’est bien la bonne clé…')
    sound.blip(700)
  })
  $('.fb-no').addEventListener('click', () => { $('.fb-confirm').hidden = true; set('idle'); render(); sound.click(0.9) })
  $('.fb-yes').addEventListener('click', () => { $('.fb-confirm').hidden = true; run(); sound.blip(1300) })

  function run() {
    set('run')
    const steps = img.win ? WIN : RAW, total = 7000, t0 = performance.now()
    clearInterval(timer)
    timer = setInterval(() => {
      if (!root.isConnected) return clearInterval(timer)
      const f = Math.min(1, (performance.now() - t0) / total)
      let acc = 0
      for (const [part, text] of steps) { acc += part; if (f <= acc + 1e-6) { say(text); break } }
      setFill(f)
      if (f >= 1) {
        clearInterval(timer)
        set('done')
        say(img.win ? "C'est prêt ! Branche la clé sur le PC et choisis-la au démarrage (F12, F11 ou Échap)." : "C'est prêt ! Tu peux débrancher la clé : elle démarre.")
        $('.fb-go').textContent = 'Flasher une autre clé'
        confetti(); sound.blip(1600)
      }
    }, 80)
  }

  render()
}
