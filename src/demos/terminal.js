// Démo Proxmox : un terminal qui rejoue le menu et les contrôles du vrai script
// (proxmox-batch.sh). Aucune commande n'est exécutée : tout est simulé ici.
const GATEWAY = '192.168.1.1', BROADCAST = '192.168.1.255'
const MAX_RAM = 7680, MAX_DISK = { 'local': 94, 'local-lvm': 412 }
const TEMPLATES = ['debian-12-standard_12.7-1_amd64.tar.zst', 'ubuntu-24.04-standard_24.04-2_amd64.tar.zst', 'alpine-3.20-default_20240908_amd64.tar.xz']
const ISOS = ['debian-12.7.0-amd64-netinst.iso', 'ubuntu-24.04.1-live-server-amd64.iso']
const MENU = `==============================================
   PROXMOX AUTO-INSTALLER - ULTIMATE EDITION
==============================================
1. Créer un ou plusieurs conteneurs (LXC)
2. Créer un ou plusieurs machines virtuelles (VM)
3. Voir les templates disponibles
4. Voir les ISO disponibles
5. Quitter
==============================================`

export default function terminal(root, { sound }) {
  root.innerHTML = `
    <div class="td">
      <div class="td-bar"><i></i><i></i><i></i><span>root@pve:~# ./proxmox-batch.sh</span></div>
      <div class="td-out" aria-live="polite"></div>
      <form class="td-line"><span class="td-prompt"></span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Réponse au script" /></form>
    </div>
    <p class="td-hint">Passerelle simulée : <code>${GATEWAY}</code> · Broadcast : <code>${BROADCAST}</code> · Rien n'est exécuté pour de vrai.</p>`

  const out = root.querySelector('.td-out'), input = root.querySelector('input'), prompt = root.querySelector('.td-prompt'), form = root.querySelector('form')
  let ask = null, secret = false, engaged = false
  let nextId = 101

  const print = (t, cls = '') => {
    const p = document.createElement('div')
    if (cls) p.className = cls
    p.textContent = t
    out.appendChild(p)
    out.scrollTop = out.scrollHeight
  }
  // pose une question et attend la réponse (Promise)
  const q = (label, opts = {}) => new Promise(res => { prompt.textContent = label; secret = !!opts.secret; input.type = secret ? 'password' : 'text'; ask = res; if (engaged) input.focus({ preventScroll: true }) })
  const sleep = ms => new Promise(r => setTimeout(r, ms))

  form.addEventListener('submit', e => {
    e.preventDefault()
    if (!ask) return
    const v = input.value.trim()
    print(prompt.textContent + (secret ? '•'.repeat(v.length) : v), 'td-echo')
    input.value = ''
    sound.click(1.1)
    const r = ask; ask = null; prompt.textContent = ''
    r(v)
  })
  input.addEventListener('keydown', () => sound.click(1.3 + Math.random() * 0.2))
  root.querySelector('.td').addEventListener('click', () => { engaged = true; input.focus({ preventScroll: true }) })
  input.addEventListener('focus', () => { engaged = true })

  async function int(label, min, max, err) {
    for (;;) {
      const v = await q(label)
      if (!/^\d+$/.test(v)) continue
      if (+v < min || +v > max) { print(err, 'td-err'); continue }
      return +v
    }
  }
  async function name() {
    for (;;) { const v = await q('Nom (lettres/chiffres/-) : '); if (/^[a-zA-Z0-9-]+$/.test(v)) return v; print('Nom invalide.', 'td-err') }
  }
  async function ip() {
    print(`   -> Infos détectées : Passerelle=${GATEWAY} | Broadcast=${BROADCAST}`, 'td-dim')
    for (;;) {
      const v = await q('Adresse IP (ex: 192.168.1.50) : ')
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) { print('Erreur : Format invalide.', 'td-err'); continue }
      const o = v.split('.').map(Number)
      if (o.some(x => x > 255)) print('Erreur : Max 255.', 'td-err')
      else if (v === GATEWAY) print('Erreur : IP Gateway interdite.', 'td-err')
      else if (v === BROADCAST) print('Erreur : IP Broadcast interdite.', 'td-err')
      else if (o[3] === 0) print('Erreur : .0 interdit.', 'td-err')
      else return v
    }
  }
  async function password(label) {
    for (;;) { const v = await q(label, { secret: true }); if (v.length >= 5) return v; print('Erreur : Min 5 caractères.', 'td-err') }
  }
  async function choose(list, title) {
    print(`--- ${title} ---`)
    list.forEach((t, i) => print(`${i + 1}) ${t}`))
    print(`${list.length + 1}) Annuler`)
    for (;;) {
      const v = await q('Choix : ')
      const n = +v
      if (n >= 1 && n <= list.length) return list[n - 1]
      if (n === list.length + 1) return ''
    }
  }

  async function create(kind) {
    const isVM = kind === 'vm'
    const nb = await int(isVM ? 'Nombre de VMs à créer : ' : 'Nombre de conteneurs à créer : ', 1, 5, 'Entre 1 et 5 dans cette démo.')
    for (let i = 1; i <= nb; i++) {
      print('==============================================')
      print(isVM ? `Création de la VM ${i} / ${nb}` : `Création du CONTENEUR ${i} / ${nb}`)
      print('==============================================')
      const nom = await name()
      let st = (await q('Stockage (local/local-lvm) [défaut: local-lvm] : ')) || 'local-lvm'
      if (st !== 'local' && st !== 'local-lvm') st = 'local-lvm'
      print(`   -> Max Disp: RAM=${MAX_RAM}Mo | Disque=${MAX_DISK[st]}Go`, 'td-dim')
      const ram = await int(`RAM (Mo) [Min: 512 - Max: ${MAX_RAM}] : `, 512, MAX_RAM, 'Erreur RAM.')
      const disk = await int(`Disque (Go) [Min: 2 - Max: ${MAX_DISK[st]}] : `, 2, MAX_DISK[st], 'Erreur Disque.')
      const addr = await ip()
      let res = await q(isVM ? 'ISO (vide pour chercher) : ' : 'Template (vide pour chercher) : ')
      if (!res) res = await choose(isVM ? ISOS : TEMPLATES, isVM ? 'Liste des ISOs' : 'Recherche de templates')
      if (!res || !(isVM ? ISOS : TEMPLATES).includes(res)) {
        print(isVM ? "ERREUR FATALE : Pas d'ISO valide. Retour menu." : 'ERREUR FATALE : Pas de template. Retour menu.', 'td-err')
        return
      }
      await password(isVM ? 'Mot de passe Cloud-init (Min 5 char) : ' : 'Mot de passe root (Min 5 char) : ')
      const dns = (await q('DNS : ')) || '1.1.1.1'
      const id = nextId++
      print(`-> Création ${isVM ? 'VM' : 'CT'} ${id} (${nom})...`)
      await sleep(400)
      print(isVM
        ? `qm create ${id} --name "${nom}" --memory ${ram} --scsi0 "${st}:${disk}" --cdrom "local:iso/${res}" --ipconfig0 ip=${addr}/24,gw=${GATEWAY}`
        : `pct create ${id} ${res} -hostname "${nom}" -memory ${ram} -storage ${st} -rootfs ${disk} -net0 name=eth0,bridge=vmbr0,ip=${addr}/24,gw=${GATEWAY}`, 'td-cmd')
      await sleep(700)
      if (isVM) print(`qm set ${id} --nameserver "${dns}"`, 'td-cmd')
      else print(`pct exec ${id} -- bash -c "echo 'nameserver ${dns}' > /etc/resolv.conf"`, 'td-cmd')
      await sleep(300)
      print(isVM ? `SUCCESS : VM ${nom} créée !` : `SUCCESS : Conteneur ${nom} créé !`, 'td-ok')
      sound.chime()
    }
  }

  async function main() {
    for (;;) {
      MENU.split('\n').forEach(l => print(l, l.startsWith('=') || l.includes('PROXMOX') ? 'td-acc' : ''))
      const opt = await q('Votre choix : ')
      if (opt === '1') await create('ct')
      else if (opt === '2') await create('vm')
      else if (opt === '3') { print('--- Templates présents ---'); TEMPLATES.forEach(t => print('  ' + t)) }
      else if (opt === '4') { print('--- Liste des ISOs ---'); ISOS.forEach(t => print('  ' + t)) }
      else if (opt === '5') { print('Au revoir !', 'td-ok'); await q('(Entrée pour relancer le script) '); out.innerHTML = ''; continue }
      else { print('Option invalide.', 'td-err'); await sleep(500) }
      await q('Appuyez sur Entrée...')
      out.innerHTML = ''
    }
  }
  main()
}
