// Le bureau de Yanis en 3D (Three.js) : une pièce en diorama, vue en isométrique,
// où chaque objet est un chapitre. Ce module ne gère que la 3D ; l'interface est dans ui.js.
import {
  Scene, OrthographicCamera, WebGLRenderer, Group, Mesh, MeshToonMaterial, MeshBasicMaterial,
  BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, PlaneGeometry, TorusGeometry, CircleGeometry,
  CanvasTexture, DataTexture, RedFormat, NearestFilter, SRGBColorSpace, TextureLoader,
  HemisphereLight, DirectionalLight, PointLight, AmbientLight, BackSide, AdditiveBlending,
  Raycaster, Vector2, Vector3, Color, PCFSoftShadowMap, MathUtils,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const INK = 0x0b0a10
const T = 0.03 // épaisseur des contours

/* ---------- matériaux & formes de base ---------- */
const ramp = (() => {
  const t = new DataTexture(new Uint8Array([70, 150, 255]), 3, 1, RedFormat)
  t.minFilter = t.magFilter = NearestFilter
  t.needsUpdate = true
  return t
})()
const toon = (color, extra = {}) => new MeshToonMaterial({ color, gradientMap: ramp, ...extra })
const inkMat = () => new MeshBasicMaterial({ color: INK, side: BackSide })

// chaque objet interactif garde la liste de ses contours pour pouvoir les colorer au survol
function outlineFor(parent, mesh, geo) {
  const o = new Mesh(geo, parent.userData.ink || (parent.userData.ink = inkMat()))
  mesh.add(o)
  return o
}
function box(parent, w, h, d, color, pos, opt = {}) {
  const r = opt.r ?? Math.min(0.06, w / 4, h / 4, d / 4)
  const m = new Mesh(new RoundedBoxGeometry(w, h, d, 2, r), opt.mat || toon(color))
  m.position.set(...pos)
  if (opt.rot) m.rotation.set(...opt.rot)
  m.castShadow = opt.shadow !== false
  m.receiveShadow = true
  if (opt.outline !== false) outlineFor(parent, m, new RoundedBoxGeometry(w + T * 2, h + T * 2, d + T * 2, 2, r + T))
  parent.add(m)
  return m
}
function cyl(parent, rt, rb, h, color, pos, opt = {}) {
  const seg = opt.seg || 24
  const m = new Mesh(new CylinderGeometry(rt, rb, h, seg, 1, !!opt.open), opt.mat || toon(color, opt.open ? { side: 2 } : {}))
  m.position.set(...pos)
  if (opt.rot) m.rotation.set(...opt.rot)
  m.castShadow = opt.shadow !== false
  m.receiveShadow = true
  if (opt.outline !== false) outlineFor(parent, m, new CylinderGeometry(rt + T, rb + T, h + T * 2, seg))
  parent.add(m)
  return m
}
function sphere(parent, r, color, pos, opt = {}) {
  const m = new Mesh(new SphereGeometry(r, 24, 16), opt.mat || toon(color))
  m.position.set(...pos)
  m.castShadow = opt.shadow !== false
  if (opt.outline !== false) outlineFor(parent, m, new SphereGeometry(r + T, 24, 16))
  parent.add(m)
  return m
}
function plane(parent, w, h, tex, pos, rot, opt = {}) {
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tex, transparent: !!opt.transparent, toneMapped: false, ...(opt.blend ? { blending: AdditiveBlending, depthWrite: false } : {}) }))
  m.position.set(...pos)
  if (rot) m.rotation.set(...rot)
  parent.add(m)
  return m
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

/* ---------- textures dessinées ---------- */
function windowTex(day) {
  return canvasTex(512, 640, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h)
    if (day) { sky.addColorStop(0, '#7cc4ff'); sky.addColorStop(1, '#ffe2b8') } else { sky.addColorStop(0, '#0b0b2a'); sky.addColorStop(1, '#3a2a6b') }
    g.fillStyle = sky; g.fillRect(0, 0, w, h)
    if (day) {
      g.fillStyle = '#fff8'; [[120, 160, 70], [340, 120, 90], [260, 260, 60]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.arc(x + r, y + 10, r * .8, 0, 7); g.arc(x - r * .9, y + 14, r * .7, 0, 7); g.fill() })
      g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(400, 300, 46, 0, 7); g.fill()
    } else {
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .8 + .2})`; g.fillRect(Math.random() * w, Math.random() * h * .7, 2, 2) }
      g.fillStyle = '#fdf6e3'; g.beginPath(); g.arc(380, 150, 46, 0, 7); g.fill()
      g.fillStyle = '#0b0b2a'; g.beginPath(); g.arc(400, 136, 42, 0, 7); g.fill()
    }
    // la ville au loin, avec quelques fenêtres allumées la nuit
    for (let x = 0; x < w; x += 46) {
      const bh = 120 + ((x * 37) % 170)
      g.fillStyle = day ? '#9aa6c9' : '#14122e'
      g.fillRect(x, h - bh, 40, bh)
      if (!day) for (let y = h - bh + 14; y < h - 10; y += 22) for (let wx = x + 6; wx < x + 36; wx += 12) if (((wx * 7 + y) % 5) === 0) { g.fillStyle = '#ffd27a'; g.fillRect(wx, y, 6, 9) }
    }
  })
}
function macScreenTex() {
  return canvasTex(512, 320, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#312e81'); bg.addColorStop(.55, '#a855f7'); bg.addColorStop(1, '#f472b6')
    g.fillStyle = bg; g.fillRect(0, 0, w, h)
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(w / 2 - 70, 0, 140, 26, [0, 0, 14, 14]); g.fill()
    g.fillStyle = '#fdf6e3'; g.beginPath(); g.arc(w / 2 - 9, 12, 5, 0, 7); g.arc(w / 2 + 9, 12, 5, 0, 7); g.fill()
    g.fillStyle = '#fff3'; g.beginPath(); g.roundRect(w / 2 - 90, h - 34, 180, 24, 10); g.fill()
  })
}
function crtTex() {
  return canvasTex(320, 256, (g, w, h) => {
    g.fillStyle = '#062b14'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#4ade80'; g.font = '600 22px "JetBrains Mono", monospace'
    ;['> node bot.js', 'Bot connecté ✓', '> /ticket ouvrir', 'Ticket #12 créé', '> _'].forEach((l, i) => g.fillText(l, 18, 40 + i * 42))
    for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y, w, 2) }
  })
}
function neonTex() {
  return canvasTex(1024, 320, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = '800 170px "Bricolage Grotesque", sans-serif'
    g.shadowColor = '#f472b6'; g.shadowBlur = 40
    g.strokeStyle = '#ff9ad5'; g.lineWidth = 10; g.strokeText('OsaLabs', w / 2, h / 2)
    g.shadowBlur = 12; g.fillStyle = '#fff0f8'; g.fillText('OsaLabs', w / 2, h / 2)
  })
}
function calendarTex(days) {
  return canvasTex(512, 600, (g, w, h) => {
    g.fillStyle = '#fffdf8'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#f472b6'; g.fillRect(0, 0, w, 120)
    g.fillStyle = '#fff'; g.font = '800 54px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center'
    g.fillText(new Date().toLocaleString('fr-FR', { month: 'long' }).toUpperCase(), w / 2, 80)
    const cols = ['#ebe5d8', '#f9d3e6', '#f3a6cf', '#d877ab', '#c2337a']
    const recent = days.slice(-42)
    recent.forEach((d, i) => {
      const x = 40 + (i % 7) * 64, y = 160 + Math.floor(i / 7) * 68
      g.fillStyle = cols[d[2]]; g.beginPath(); g.roundRect(x, y, 50, 50, 10); g.fill()
    })
    g.fillStyle = '#4a4740'; g.font = '600 28px "JetBrains Mono", monospace'
    g.fillText('github.com/osayanis', w / 2, h - 30)
  })
}
function screenTex(color, label) {
  return canvasTex(256, 400, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, color)
    g.fillStyle = bg; g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'; g.font = '700 30px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center'
    g.fillText(label, w / 2, h / 2)
    g.fillStyle = '#fff6'; g.beginPath(); g.roundRect(w / 2 - 40, 16, 80, 16, 8); g.fill()
  })
}

/* ---------- la pièce ---------- */
export async function createRoom(canvas, { snapshot, avatar }) {
  await document.fonts?.ready
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200)

  // lumières
  const hemi = new HemisphereLight(0x9fa8ff, 0x2a1a3a, 0.9)
  const ambient = new AmbientLight(0xffffff, 0.15)
  const moon = new DirectionalLight(0xa9b8ff, 1.1)
  moon.position.set(8, 14, 10)
  moon.castShadow = true
  moon.shadow.mapSize.set(2048, 2048)
  Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 })
  moon.shadow.bias = -0.0008
  moon.shadow.radius = 4
  const lamp = new PointLight(0xffb35c, 9, 9, 1.6)
  scene.add(hemi, ambient, moon, lamp)

  const world = new Group()
  scene.add(world)
  const objects = {}
  const obj = (id, anchor) => {
    const g = new Group()
    g.userData = { id, anchor: new Vector3(...anchor), ink: inkMat() }
    world.add(g)
    objects[id] = g
    return g
  }
  const deco = new Group()
  deco.userData.ink = inkMat()
  world.add(deco)

  // sol, murs, plinthes
  const floorMat = toon(0x6b4a3a), wallBackMat = toon(0x3b3363), wallLeftMat = toon(0x332c58)
  box(deco, 10, 0.3, 10, 0, [0, -0.15, 0], { mat: floorMat, r: 0.05, shadow: false })
  for (let i = -4; i <= 4; i += 2) box(deco, 10, 0.012, 0.03, 0x5a3c2f, [0, 0.006, i], { outline: false, shadow: false })
  box(deco, 10, 6, 0.3, 0, [0, 3, -5.15], { mat: wallBackMat, r: 0.05, shadow: false })
  box(deco, 0.3, 6, 10, 0, [-5.15, 3, 0], { mat: wallLeftMat, r: 0.05, shadow: false })
  box(deco, 10, 0.25, 0.08, 0xd9c7ae, [0, 0.12, -4.96], { outline: false })
  box(deco, 0.08, 0.25, 10, 0xd9c7ae, [-4.96, 0.12, 0], { outline: false })

  // tapis
  const rug = cyl(deco, 2.6, 2.6, 0.04, 0xf3a6cf, [0.6, 0.02, 0.6], { seg: 48, shadow: false })
  rug.receiveShadow = true
  cyl(deco, 1.9, 1.9, 0.045, 0xc4b5fd, [0.6, 0.025, 0.6], { seg: 48, shadow: false, outline: false })

  // fenêtre (mur du fond)
  const win = new Group(); deco.add(win)
  box(win, 2.6, 3.0, 0.18, 0xe9dcc9, [-3.1, 3.4, -4.94])
  const nightWin = windowTex(false), dayWin = windowTex(true)
  const glass = plane(win, 2.3, 2.7, nightWin, [-3.1, 3.4, -4.83])
  box(win, 0.08, 2.7, 0.1, 0xe9dcc9, [-3.1, 3.4, -4.8], { outline: false })
  box(win, 2.3, 0.08, 0.1, 0xe9dcc9, [-3.1, 3.4, -4.8], { outline: false })
  box(win, 2.9, 0.14, 0.4, 0xe9dcc9, [-3.1, 1.85, -4.75])

  // bureau
  box(deco, 5.4, 0.18, 2.0, 0xa47148, [0.7, 1.9, -3.85])
  ;[[-1.85, -4.7], [3.25, -4.7], [-1.85, -3.0], [3.25, -3.0]].forEach(([x, z]) => box(deco, 0.14, 1.8, 0.14, 0x7a5236, [x, 0.9, z]))
  box(deco, 1.3, 1.0, 1.7, 0x8a5d3d, [2.45, 1.25, -3.85])
  box(deco, 1.0, 0.04, 0.02, 0xe9dcc9, [2.45, 1.3, -2.98], { outline: false })

  // chaise
  const chair = new Group(); chair.userData.ink = deco.userData.ink; deco.add(chair)
  box(chair, 1.1, 0.16, 1.1, 0x2b2a3a, [0.6, 1.15, -2.0])
  box(chair, 1.1, 1.2, 0.16, 0x2b2a3a, [0.6, 1.85, -1.45], { rot: [-0.12, 0, 0] })
  cyl(chair, 0.06, 0.06, 0.9, 0x555, [0.6, 0.6, -2.0])
  cyl(chair, 0.55, 0.55, 0.06, 0x2b2a3a, [0.6, 0.12, -2.0], { seg: 5 })

  // lampe de bureau
  const lampG = new Group(); lampG.userData.ink = deco.userData.ink; deco.add(lampG)
  cyl(lampG, 0.28, 0.32, 0.08, 0x2b2a3a, [3.05, 2.03, -4.4])
  box(lampG, 0.07, 1.1, 0.07, 0x2b2a3a, [3.05, 2.6, -4.4], { rot: [0, 0, 0.25] })
  box(lampG, 0.07, 0.8, 0.07, 0x2b2a3a, [2.75, 3.25, -4.4], { rot: [0, 0, -0.9] })
  const shade = cyl(lampG, 0.12, 0.42, 0.45, 0xffb35c, [2.35, 3.35, -4.4], { rot: [0, 0, 0.6], open: true })
  const bulb = sphere(lampG, 0.12, 0xfff3c4, [2.27, 3.2, -4.4], { mat: new MeshBasicMaterial({ color: 0xfff3c4 }), outline: false, shadow: false })
  lamp.position.set(2.2, 3.0, -4.1)

  // plante au sol
  cyl(deco, 0.4, 0.3, 0.7, 0xd97757, [-4.2, 0.35, -4.2])
  ;[[0, 1.25, 0, 0], [0.18, 1.1, 0.1, 0.5], [-0.2, 1.05, -0.05, -0.5], [0.05, 1.0, -0.2, 0.3]].forEach(([dx, y, dz, r]) => {
    const c = new Mesh(new ConeGeometry(0.22, 1.2, 10), toon(0x4caf6a)); c.position.set(-4.2 + dx, y, -4.2 + dz); c.rotation.set(r * .5, 0, r); c.castShadow = true; deco.add(c)
    outlineFor(deco, c, new ConeGeometry(0.22 + T, 1.2 + T * 2, 10))
  })

  /* ===== OBJETS INTERACTIFS ===== */

  // 1. le vieil écran (étagère du mur gauche)
  box(deco, 0.7, 0.1, 3.8, 0xa47148, [-4.62, 3.35, 0.4])
  ;[-1.2, 2.0].forEach(z => box(deco, 0.5, 0.35, 0.08, 0x7a5236, [-4.75, 3.15, z]))
  const crt = obj('crt', [-4.3, 4.6, -0.5])
  box(crt, 0.95, 0.8, 0.95, 0xd8cfb8, [-4.5, 3.82, -0.5])
  box(crt, 0.7, 0.55, 0.5, 0xc9bea3, [-4.75, 3.82, -0.5], { outline: false })
  plane(crt, 0.66, 0.52, crtTex(), [-4.015, 3.85, -0.5], [0, Math.PI / 2, 0])
  box(crt, 0.3, 0.06, 0.6, 0xd8cfb8, [-4.2, 3.43, -0.5])

  // 2. le baladeur OpenPod (étagère)
  const openpod = obj('openpod', [-4.3, 4.35, 1.6])
  box(openpod, 0.14, 0.62, 0.38, 0xf4f4f5, [-4.45, 3.72, 1.6], { r: 0.05, rot: [0, 0, 0.12] })
  plane(openpod, 0.26, 0.22, screenTex('#fb923c', '♪ OpenPod'), [-4.37, 3.86, 1.6], [0, Math.PI / 2, 0.12])
  cyl(openpod, 0.1, 0.1, 0.02, 0xd4d4d8, [-4.4, 3.6, 1.6], { rot: [0, 0, Math.PI / 2 + 0.12] })
  // petite plante sur l'étagère
  cyl(deco, 0.16, 0.12, 0.28, 0xfcc48b, [-4.55, 3.54, 2.05])
  sphere(deco, 0.2, 0x4caf6a, [-4.55, 3.8, 2.05])

  // 3. le piano (sous l'étagère)
  const piano = obj('piano', [-3.5, 2.6, 0.6])
  box(piano, 0.8, 0.2, 3.4, 0x27272a, [-4.25, 1.55, 0.6])
  box(piano, 0.34, 0.06, 3.1, 0xffffff, [-3.98, 1.66, 0.6], { r: 0.01 })
  // touches noires : motif 2 + 3 sur chaque octave
  for (let o = 0; o < 2; o++) [0, 1, 3, 4, 5].forEach(b => box(piano, 0.2, 0.06, 0.1, 0x111111, [-4.06, 1.71, -0.85 + (o * 7 + b) * 0.215 + 0.11], { r: 0.01, outline: false }))
  ;[-0.6, 1.8].forEach(z => {
    box(piano, 0.08, 1.6, 0.08, 0x3f3f46, [-4.25, 0.75, z], { rot: [0.35, 0, 0] })
    box(piano, 0.08, 1.6, 0.08, 0x3f3f46, [-4.25, 0.75, z], { rot: [-0.35, 0, 0] })
  })

  // 4. le calendrier GitHub (mur gauche)
  const calendar = obj('calendar', [-4.3, 4.4, 3.6])
  box(calendar, 0.06, 1.55, 1.3, 0xfffdf8, [-4.96, 3.25, 3.6])
  plane(calendar, 1.25, 1.48, calendarTex(snapshot?.contributions || []), [-4.92, 3.25, 3.6], [0, Math.PI / 2, 0])
  for (let k = 0; k < 6; k++) cyl(calendar, 0.03, 0.03, 0.1, 0x9ca3af, [-4.9, 4.02, 3.1 + k * 0.2], { rot: [Math.PI / 2, 0, 0], outline: false })

  // 5. le néon OsaLabs (mur du fond)
  const neon = obj('neon', [0.6, 5.3, -4.5])
  box(neon, 3.0, 1.0, 0.08, 0x1a1530, [0.6, 4.55, -4.96], { r: 0.1 })
  const neonGlow = plane(neon, 3.6, 1.4, neonTex(), [0.6, 4.55, -4.9], null, { transparent: true })

  // 6. le cadre photo (mur du fond, à droite)
  const frameObj = obj('frame', [3.9, 4.6, -4.5])
  box(frameObj, 1.3, 1.6, 0.1, 0xfde68a, [3.9, 3.55, -4.95])
  const photoMat = new MeshBasicMaterial({ color: 0xf9a8a8 })
  const photo = new Mesh(new PlaneGeometry(1.05, 1.32), photoMat)
  photo.position.set(3.9, 3.55, -4.89)
  frameObj.add(photo)
  if (avatar) new TextureLoader().setCrossOrigin('anonymous').load(avatar, t => { t.colorSpace = SRGBColorSpace; photoMat.map = t; photoMat.color.set(0xffffff); photoMat.needsUpdate = true })

  // 7. le MacBook
  const macbook = obj('macbook', [0.85, 3.4, -3.8])
  box(macbook, 1.5, 0.06, 1.0, 0xc7c9d1, [0.85, 2.02, -3.65])
  const lid = new Group()
  lid.userData.ink = macbook.userData.ink
  lid.position.set(0.85, 2.05, -4.15)
  lid.rotation.x = -0.22
  macbook.add(lid)
  box(lid, 1.5, 1.0, 0.05, 0xc7c9d1, [0, 0.5, 0])
  const macScreen = plane(lid, 1.38, 0.88, macScreenTex(), [0, 0.5, 0.03])

  // 8. le clavier PORTFOLIO
  const keyboard = obj('keyboard', [-0.6, 2.7, -3.15])
  box(keyboard, 1.5, 0.08, 0.55, 0x23212b, [-0.6, 2.03, -3.15])
  const capColors = [0xf3a6cf, 0xc4b5fd, 0xa7e8bd, 0xfcc48b, 0x93c5fd, 0xf9a8a8, 0xfde68a, 0xa5b4fc, 0x86efac]
  capColors.forEach((c, i) => {
    const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4
    box(keyboard, 0.22, 0.09, 0.2, c, [-1.12 + col * 0.26 + (row ? -0.05 : 0.05), 2.12, -3.27 + row * 0.24], { r: 0.03, outline: false })
  })
  box(keyboard, 0.3, 0.09, 0.44, 0xfde68a, [-0.0, 2.12, -3.15], { r: 0.03, outline: false })

  // 9. le cahier de NSI
  const notebook = obj('notebook', [-1.75, 2.6, -3.6])
  box(notebook, 0.75, 0.08, 0.95, 0xfde68a, [-1.75, 2.03, -3.7], { rot: [0, 0.25, 0] })
  box(notebook, 0.7, 0.05, 0.9, 0xffffff, [-1.73, 2.0, -3.7], { rot: [0, 0.25, 0], outline: false })
  cyl(notebook, 0.025, 0.025, 0.8, 0xf97316, [-1.3, 2.1, -3.5], { rot: [Math.PI / 2, 0, 0.9] })

  // 10. le téléphone
  const phone = obj('phone', [1.95, 2.6, -3.05])
  const phoneBody = box(phone, 0.36, 0.05, 0.7, 0x18181b, [1.95, 2.02, -3.15], { r: 0.04, rot: [0, -0.35, 0] })
  plane(phoneBody, 0.3, 0.6, screenTex('#f472b6', '1 appel'), [0, 0.03, 0], [-Math.PI / 2, 0, 0])

  // 11. le petit serveur
  const server = obj('server', [4.25, 2.6, -2.9])
  box(server, 0.9, 1.9, 1.2, 0x1f2937, [4.25, 0.95, -3.35])
  const leds = []
  for (let k = 0; k < 4; k++) {
    box(server, 0.7, 0.28, 0.02, 0x374151, [4.25, 1.55 - k * 0.38, -2.74], { outline: false })
    const led = new Mesh(new SphereGeometry(0.035, 8, 8), new MeshBasicMaterial({ color: k % 2 ? 0x86efac : 0x60a5fa }))
    led.position.set(4.52, 1.55 - k * 0.38, -2.72)
    server.add(led); leds.push(led)
  }

  /* ---------- la mascotte ---------- */
  const mascot = new Group()
  const mInk = inkMat()
  mascot.userData.ink = mInk
  const body = sphere(mascot, 0.34, 0xfdf6e3, [0, 0, 0], { mat: toon(0xfdf6e3, { emissive: 0x6b6250 }) })
  const eyes = new Group()
  ;[-0.11, 0.11].forEach(x => {
    const e = new Mesh(new SphereGeometry(0.06, 12, 12), new MeshBasicMaterial({ color: 0x111111 }))
    e.scale.set(0.8, 1.15, 0.6); e.position.set(x, 0.04, 0.3)
    const hl = new Mesh(new SphereGeometry(0.018, 8, 8), new MeshBasicMaterial({ color: 0xffffff }))
    hl.position.set(-0.015, 0.025, 0.05); e.add(hl)
    eyes.add(e)
  })
  body.add(eyes)
  mascot.position.set(1.6, 3.2, 0.8)
  scene.add(mascot)

  /* ---------- jour / nuit ---------- */
  function setDay(day) {
    hemi.color.set(day ? 0xffffff : 0x9fa8ff); hemi.groundColor.set(day ? 0xd9c7ae : 0x2a1a3a); hemi.intensity = day ? 1.7 : 0.9
    ambient.intensity = day ? 0.35 : 0.15
    moon.color.set(day ? 0xfff1d6 : 0xa9b8ff); moon.intensity = day ? 2.0 : 1.1
    lamp.intensity = day ? 2 : 9
    bulb.material.color.set(day ? 0xfff8e1 : 0xfff3c4)
    glass.material.map = day ? dayWin : nightWin; glass.material.needsUpdate = true
    wallBackMat.color.set(day ? 0xf1e4d3 : 0x3b3363)
    wallLeftMat.color.set(day ? 0xe8d8c4 : 0x332c58)
    floorMat.color.set(day ? 0xc69c72 : 0x6b4a3a)
    neonGlow.material.opacity = day ? 0.55 : 1
  }

  /* ---------- caméra ---------- */
  const DIR = new Vector3(1, 0.82, 1).normalize()
  const view = { yaw: 0, pitch: 0, zoom: 1, target: new Vector3(0.1, 2.0, -0.6) }
  const goal = { yaw: 0, pitch: 0, zoom: 1, target: view.target.clone() }
  const home = { target: view.target.clone(), zoom: 1 }
  let frustum = 12, panelShift = 0

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    const aspect = w / h
    // assez large pour voir toute la pièce, même sur un téléphone en portrait
    frustum = Math.max(11.5, 15 / aspect)
    camera.left = -frustum * aspect / 2; camera.right = frustum * aspect / 2
    camera.top = frustum / 2; camera.bottom = -frustum / 2
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(canvas)
  resize()

  const tmp = new Vector3(), right = new Vector3()
  function placeCamera() {
    const dir = DIR.clone().applyAxisAngle(new Vector3(0, 1, 0), view.yaw)
    dir.y += view.pitch; dir.normalize()
    // décalage latéral quand le panneau est ouvert, pour garder l'objet visible
    right.crossVectors(new Vector3(0, 1, 0), dir).normalize().multiplyScalar(panelShift * frustum / view.zoom)
    camera.position.copy(view.target).add(right).addScaledVector(dir, 40)
    camera.lookAt(tmp.copy(view.target).add(right))
    camera.zoom = view.zoom
    camera.updateProjectionMatrix()
  }

  /* ---------- survol & sélection ---------- */
  const ray = new Raycaster()
  const ptr = new Vector2()
  const pickables = []
  Object.values(objects).forEach(g => g.traverse(m => { if (m.isMesh && m.material !== g.userData.ink) pickables.push(m) }))
  const findObj = m => { while (m && !m.userData?.anchor) m = m.parent; return m }
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect()
    ptr.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ptr, camera)
    const hit = ray.intersectObjects(pickables, false)[0]
    return hit ? findObj(hit.object).userData.id : null
  }
  let hovered = null, focused = null
  const HL = new Color(0xffb35c)
  function paint() {
    Object.values(objects).forEach(g => {
      const on = g.userData.id === hovered || g.userData.id === focused
      g.userData.ink.color.copy(on ? HL : new Color(INK))
    })
  }

  /* ---------- mascotte : vole jusqu'à un objet ---------- */
  const mGoal = mascot.position.clone()
  function mascotTo(id) {
    // la mascotte se pose à côté de l'objet, un peu vers le visiteur, sans le masquer
    if (id) mGoal.copy(objects[id].userData.anchor).add(new Vector3(-0.55, 0.15, 0.95))
    else mGoal.set(1.6, 3.2, 0.8)
  }

  /* ---------- boucle ---------- */
  let t = 0, last = performance.now(), running = true
  const listeners = []
  function frame(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now; t += dt
    const k = 1 - Math.pow(0.0015, dt)
    view.yaw += (goal.yaw - view.yaw) * k
    view.pitch += (goal.pitch - view.pitch) * k
    view.zoom += (goal.zoom - view.zoom) * k
    view.target.lerp(goal.target, k)
    panelShift += ((focused && api.panelOpen ? api.panelShiftGoal : 0) - panelShift) * k
    placeCamera()
    // vie de la pièce
    mascot.position.lerp(mGoal, 1 - Math.pow(0.02, dt))
    body.position.y = Math.sin(t * 2.2) * 0.08
    mascot.quaternion.copy(camera.quaternion)
    eyes.position.x = MathUtils.clamp(ptr.x * 0.04, -0.04, 0.04)
    eyes.position.y = MathUtils.clamp(ptr.y * 0.03, -0.03, 0.03)
    eyes.scale.y = (t % 4.2) > 4.05 ? 0.15 : 1
    leds.forEach((l, i) => { l.visible = Math.sin(t * (3 + i) + i) > -0.3 })
    neonGlow.material.opacity = (document.documentElement.classList.contains('dark') ? 1 : 0.55) * (0.88 + Math.sin(t * 7) * 0.04 + (Math.random() < 0.004 ? -0.5 : 0))
    phone.position.x = (Math.floor(t * 10) % 30 < 4) ? Math.sin(t * 90) * 0.012 : 0
    macScreen.material.color.setScalar(0.92 + Math.sin(t * 1.5) * 0.08)
    renderer.render(scene, camera)
    listeners.forEach(f => f())
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  const project = v => {
    tmp.copy(v).project(camera)
    return { x: (tmp.x * 0.5 + 0.5) * canvas.clientWidth, y: (-tmp.y * 0.5 + 0.5) * canvas.clientHeight }
  }

  const api = {
    objects: Object.keys(objects),
    panelOpen: false,
    panelShiftGoal: 0.17,
    setDay,
    pick,
    hover(id) { if (hovered !== id) { hovered = id; paint() } },
    focus(id) {
      focused = id; paint()
      const a = objects[id].userData.anchor
      goal.target.set(a.x, a.y - 0.9 - (innerWidth < 760 ? 1.3 : 0), a.z)
      goal.zoom = innerWidth < 760 ? 1.5 : 1.75
      mascotTo(id)
    },
    unfocus() {
      focused = null; paint()
      goal.target.copy(home.target); goal.zoom = home.zoom
      mascotTo(null)
    },
    rotate(dx, dy) {
      goal.yaw = MathUtils.clamp(goal.yaw + dx, -0.65, 0.65)
      goal.pitch = MathUtils.clamp(goal.pitch + dy, -0.25, 0.3)
    },
    reset() { goal.yaw = 0; goal.pitch = 0; goal.zoom = home.zoom; goal.target.copy(home.target) },
    zoomBy(f) { goal.zoom = MathUtils.clamp(goal.zoom * f, 0.75, 2.6) },
    anchorScreen(id) { return project(objects[id].userData.anchor) },
    mascotScreen() { return project(tmp.copy(mascot.position).add(new Vector3(0, 0.45 + body.position.y, 0))) },
    onFrame(f) { listeners.push(f) },
    pause(p) { const was = running; running = !p; if (running && !was) { last = performance.now(); requestAnimationFrame(frame) } },
  }
  return api
}
