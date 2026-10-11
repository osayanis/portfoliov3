// Le bureau de Yanis en 3D (Three.js). On se tient dans la pièce, face au grand bureau
// en bois, avec la baie vitrée derrière. Chaque objet interactif est un chapitre.
// Ce module ne gère que la 3D ; l'interface est dans main.js.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial,
  CylinderGeometry, SphereGeometry, ConeGeometry, PlaneGeometry, TorusGeometry, BufferGeometry, Float32BufferAttribute,
  Points, PointsMaterial, VideoTexture, InstancedMesh, Object3D, BoxGeometry, Sprite, SpriteMaterial, CanvasTexture, SRGBColorSpace, RepeatWrapping, TextureLoader,
  HemisphereLight, DirectionalLight, PointLight, SpotLight, AdditiveBlending,
  Raycaster, Vector2, Vector3, Color, PCFSoftShadowMap, ACESFilmicToneMapping, PMREMGenerator, DoubleSide, MathUtils,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RECORDS } from './records.js'

/* ---------- outils ---------- */
const mat = (color, o = {}) => new MeshStandardMaterial({ color, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, ...o.extra, ...(o.map ? { map: o.map, bumpMap: o.bump === false ? null : o.map, bumpScale: o.bumpScale ?? 1.2 } : {}), ...(o.emissive ? { emissive: o.emissive, emissiveIntensity: o.ei ?? 1 } : {}) })
const glow = (color, o = {}) => new MeshBasicMaterial({ color, toneMapped: false, ...o })
function mesh(parent, geo, m, pos, rot, o = {}) {
  const x = new Mesh(geo, typeof m === 'number' || typeof m === 'string' ? mat(m) : m)
  x.position.set(...pos)
  if (rot) x.rotation.set(...rot)
  x.castShadow = o.cast !== false
  x.receiveShadow = o.receive !== false
  parent.add(x)
  return x
}
const box = (p, w, h, d, m, pos, rot, o = {}) => mesh(p, new RoundedBoxGeometry(w, h, d, 2, o.r ?? Math.min(0.02, w / 4, h / 4, d / 4)), m, pos, rot, o)
const cyl = (p, rt, rb, h, m, pos, rot, o = {}) => mesh(p, new CylinderGeometry(rt, rb, h, o.seg || 24, 1, !!o.open), m, pos, rot, o)
const ball = (p, r, m, pos, o = {}) => mesh(p, new SphereGeometry(r, o.seg || 24, Math.max(8, (o.seg || 24) * 0.66 | 0)), m, pos, null, o)
const quad = (p, w, h, m, pos, rot, o = {}) => mesh(p, new PlaneGeometry(w, h), m, pos, rot, { cast: false, ...o })
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(...repeat) }
  return t
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()

/* ---------- textures dessinées ---------- */
function woodTex(base, dark, planks = 0, repeat) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(${dark},${0.05 + rnd() * 0.12})`; g.lineWidth = 1 + rnd() * 3
      const y = rnd() * h
      g.beginPath(); g.moveTo(0, y)
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 4 + (rnd() - 0.5) * 3)
      g.stroke()
    }
    if (planks) for (let k = 0; k < planks; k++) {
      const y0 = (h / planks) * k
      g.fillStyle = rnd() < 0.5 ? `rgba(255,220,180,${rnd() * 0.08})` : `rgba(${dark},${rnd() * 0.12})`; g.fillRect(0, y0, w, h / planks)
      g.fillStyle = `rgba(${dark},.55)`; g.fillRect(0, y0, w, 2)
      const off = rnd() * w; g.fillRect(off, y0, 2, h / planks)
    }
  }, repeat)
}
function screenTex(draw, w = 512, h = 320) { return canvasTex(w, h, draw) }
const macScreen = () => screenTex((g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#312e81'); bg.addColorStop(0.55, '#a855f7'); bg.addColorStop(1, '#f472b6')
  g.fillStyle = bg; g.fillRect(0, 0, w, h)
  g.fillStyle = '#000'; g.beginPath(); g.roundRect(w / 2 - 80, 0, 160, 30, [0, 0, 16, 16]); g.fill()
  g.fillStyle = '#fdf6e3'; g.beginPath(); g.arc(w / 2 - 10, 14, 6, 0, 7); g.arc(w / 2 + 10, 14, 6, 0, 7); g.fill()
  g.fillStyle = '#fff3'; g.beginPath(); g.roundRect(w / 2 - 100, h - 38, 200, 26, 12); g.fill()
})
const crtScreen = () => screenTex((g, w, h) => {
  g.fillStyle = '#04210f'; g.fillRect(0, 0, w, h)
  g.fillStyle = '#4ade80'; g.font = '600 30px "JetBrains Mono", monospace'
  ;['> node bot.js', 'Bot connecté ✓', '> /ticket ouvrir', 'Ticket #12 créé', '> _'].forEach((l, i) => g.fillText(l, 26, 52 + i * 56))
  for (let y = 0; y < h; y += 5) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, w, 2) }
}, 420, 320)
const phoneScreen = () => screenTex((g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#f472b6')
  g.fillStyle = bg; g.fillRect(0, 0, w, h)
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 34px "Bricolage Grotesque", sans-serif'
  g.fillText('1 appel', w / 2, h * 0.42); g.font = '500 22px "Bricolage Grotesque", sans-serif'; g.fillText('Toi ?', w / 2, h * 0.5)
  g.fillStyle = '#22c55e'; g.beginPath(); g.arc(w / 2, h * 0.78, 34, 0, 7); g.fill()
}, 240, 480)
const podScreen = () => screenTex((g, w, h) => {
  g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, w, h)
  g.fillStyle = '#f5f5f4'; g.font = '600 26px "JetBrains Mono", monospace'
  ;['Musique', 'Albums', 'Artistes', 'Réglages'].forEach((l, i) => { if (i === 0) { g.fillRect(0, 22, w, 40); g.fillStyle = '#0b0b0c' } else g.fillStyle = '#f5f5f4'; g.fillText(l, 14, 52 + i * 46) })
}, 240, 300)
const neonTex = () => canvasTex(1024, 300, (g, w, h) => {
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 170px "Bricolage Grotesque", sans-serif'
  g.shadowColor = '#ff5fae'; g.shadowBlur = 30; g.strokeStyle = '#ff8cc6'; g.lineWidth = 10; g.strokeText('OsaLabs', w / 2, h / 2)
  g.shadowBlur = 8; g.fillStyle = '#fff0f8'; g.fillText('OsaLabs', w / 2, h / 2)
})
const calTex = days => canvasTex(512, 620, (g, w, h) => {
  g.fillStyle = '#fffdf8'; g.fillRect(0, 0, w, h)
  g.fillStyle = '#e8618c'; g.fillRect(0, 0, w, 120)
  g.fillStyle = '#fff'; g.font = '800 56px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center'
  g.fillText(new Date().toLocaleString('fr-FR', { month: 'long' }).toUpperCase(), w / 2, 82)
  const cols = ['#ebe5d8', '#f9d3e6', '#f3a6cf', '#d877ab', '#c2337a']
  days.slice(-42).forEach((d, i) => { g.fillStyle = cols[d[2]]; g.beginPath(); g.roundRect(40 + (i % 7) * 64, 158 + Math.floor(i / 7) * 68, 50, 50, 10); g.fill() })
  g.fillStyle = '#5b5750'; g.font = '600 26px "JetBrains Mono", monospace'; g.fillText('github.com/osayanis', w / 2, h - 30)
})
const rugTex = () => canvasTex(1024, 720, (g, w, h) => {
  g.fillStyle = '#d8c6a8'; g.fillRect(0, 0, w, h)
  // rayures beige / crème / sable, de largeurs variées
  const bands = ['#e8dcc4', '#cbb692', '#e2d3b6', '#bda57f', '#efe5d2']
  for (let x = 0, k = 0; x < w; k++) { const bw = 18 + ((k * 37) % 5) * 14; g.fillStyle = bands[k % bands.length]; g.fillRect(x, 0, bw, h); x += bw }
  // trame de tissage
  for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(80,60,40,${0.03 + (y % 8 ? 0 : 0.03)})`; g.fillRect(0, y, w, 1) }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(60,45,30,${rnd() * 0.07})`; g.fillRect(rnd() * w, rnd() * h, 2, 1) }
  // franges légères aux extrémités
  g.fillStyle = 'rgba(255,250,240,.6)'; for (let y = 0; y < h; y += 10) { g.fillRect(0, y, 10, 3); g.fillRect(w - 10, y, 10, 3) }
})


const leafTex = (color, vein) => canvasTex(256, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const grad = g.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, color); grad.addColorStop(0.5, vein); grad.addColorStop(1, color)
  g.fillStyle = grad
  g.beginPath(); g.moveTo(w / 2, h - 4)
  g.bezierCurveTo(-30, h * 0.6, 10, h * 0.12, w / 2, 6)
  g.bezierCurveTo(w - 10, h * 0.12, w + 30, h * 0.6, w / 2, h - 4); g.fill()
  // échancrures de monstera
  g.globalCompositeOperation = 'destination-out'
  for (let k = 0; k < 5; k++) { const y = h * (0.25 + k * 0.13); g.beginPath(); g.ellipse(18, y, 30, 8, 0.4, 0, 7); g.ellipse(w - 18, y, 30, 8, -0.4, 0, 7); g.fill() }
  g.globalCompositeOperation = 'source-over'
  g.strokeStyle = 'rgba(255,255,220,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h - 4); g.lineTo(w / 2, 10); g.stroke()
})

// feuille de lierre / pothos, en forme de cœur
const ivyTex = () => canvasTex(128, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const gr = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, w * 0.6); gr.addColorStop(0, '#7cc48a'); gr.addColorStop(1, '#2f6b45')
  g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 6)
  g.bezierCurveTo(w * 0.1, h * 0.3, w * 0.02, h * 0.78, w * 0.32, h * 0.86)
  g.bezierCurveTo(w * 0.42, h * 0.9, w * 0.48, h * 0.82, w / 2, h * 0.74)
  g.bezierCurveTo(w * 0.52, h * 0.82, w * 0.58, h * 0.9, w * 0.68, h * 0.86)
  g.bezierCurveTo(w * 0.98, h * 0.78, w * 0.9, h * 0.3, w / 2, 6); g.fill()
  g.strokeStyle = 'rgba(230,255,210,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h * 0.74); g.stroke()
})
// briques de la cheminée
const brickTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5a3a2c'; g.fillRect(0, 0, w, h)
  const bh = 32, bw = 96
  for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
    const x = c * bw + (r % 2 ? bw / 2 : 0), v = 0.75 + rnd() * 0.35
    g.fillStyle = `rgb(${150 * v | 0},${82 * v | 0},${58 * v | 0})`; g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6)
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(30,15,10,${rnd() * 0.18})`; g.fillRect(x + 3 + rnd() * (bw - 10), r * bh + 3 + rnd() * (bh - 8), 4, 3) }
  }
}, [1, 1])
// des feuilles en un seul dessin : [x, y, z, rotX, rotY, rotZ, échelle]
function addLeaves(parent, material, spots, size = [0.08, 0.08]) {
  const inst = new InstancedMesh(new PlaneGeometry(...size), material, spots.length)
  const o = new Object3D(), c = new Color()
  spots.forEach(([x, y, z, rx, ry, rz, s = 1], i) => {
    o.position.set(x, y, z); o.rotation.set(rx, ry, rz, 'YXZ'); o.scale.setScalar(s); o.updateMatrix()
    inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, c.setHSL(0.33 + (rnd() - 0.5) * 0.06, 0.45, 0.42 + rnd() * 0.25))
  })
  inst.receiveShadow = true
  parent.add(inst)
  return inst
}

// des livres en un seul dessin : chaque livre est une instance (position, taille, couleur)
function addBooks(parent, spots, cols, rotY = 0) {
  const inst = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.85 }), spots.length)
  const o = new Object3D(), c = new Color()
  spots.forEach(([x, y, z, t, h], i) => {
    o.position.set(x, y + h / 2, z + t / 2); o.rotation.set(rnd() < 0.12 ? 0.12 : 0, rotY, 0); o.scale.set(0.24, h, t); o.updateMatrix()
    inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, c.set(cols[(rnd() * cols.length) | 0]))
  })
  inst.castShadow = inst.receiveShadow = true
  parent.add(inst)
  return inst
}

/* ---------- la pièce ---------- */
export async function createRoom(canvas, { snapshot, avatar }) {
  await document.fonts?.ready
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  // résolution plafonnée (1,25 au lieu de 2 sur les écrans Retina) : la différence se voit à peine, le gain est énorme
  let dpr = Math.min(devicePixelRatio || 1, 1.25)
  let still = false
  renderer.setPixelRatio(dpr)
  renderer.shadowMap.enabled = true
  // la pièce ne bouge pas : les ombres sont calculées une fois, pas à chaque image
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setClearColor(0x120c0a)

  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.05, 80)

  // lumières : la lampe de bureau, le lampadaire, la suspension, la lune (ou le soleil couchant)
  const hemi = new HemisphereLight(0xffd8b0, 0x3a2418, 0.35)
  const sky = new DirectionalLight(0x9db4ff, 1.1)
  sky.position.set(-2.5, 4.5, -8)
  sky.target.position.set(0.5, 0, 1.5)
  sky.castShadow = true
  sky.shadow.mapSize.set(2048, 2048)
  Object.assign(sky.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 })
  sky.shadow.bias = -0.0005
  sky.shadow.radius = 3
  const deskLamp = new SpotLight(0xffb25e, 5, 4, 0.8, 0.7, 1.6)
  deskLamp.castShadow = true
  deskLamp.shadow.mapSize.set(1024, 1024)
  deskLamp.shadow.bias = -0.0004
  const floorLampL = new PointLight(0xffa954, 2.2, 6, 1.6)
  const pendantL = new PointLight(0xffc073, 2.4, 4, 1.6)
  // le feu de cheminée, qui vacille
  const fireL = new PointLight(0xff7a2e, 1.2, 3.4, 1.6)
  scene.add(hemi, sky, sky.target, deskLamp, deskLamp.target, floorLampL, pendantL, fireL)
  // reflets doux sur le métal, le verre et le bois verni
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.12

  const world = new Group()
  scene.add(world)
  const objects = {}
  const obj = (id, anchor, view) => {
    const g = new Group()
    g.userData = { id, anchor: new Vector3(...anchor), view }
    world.add(g)
    objects[id] = g
    return g
  }

  /* ===== la pièce ===== */
  const W = 2.6, D0 = -3.0, D1 = 6, H = 3.0
  const floorMat = mat(0xffffff, { map: woodTex('#9a6b44', '60,34,18', 8, [3, 4]), rough: 0.6 })
  quad(world, W * 2, D1 - D0, floorMat, [0, 0, (D0 + D1) / 2], [-Math.PI / 2, 0, 0])
  const wallMat = mat(0xe9d7bf, { rough: 0.95 })
  quad(world, D1 - D0, H, wallMat, [-W, H / 2, (D0 + D1) / 2], [0, Math.PI / 2, 0])
  quad(world, D1 - D0, H, wallMat, [W, H / 2, (D0 + D1) / 2], [0, -Math.PI / 2, 0])
  // le mur du fond côté visiteur : derrière la caméra d'accueil, il ne se voit que depuis la chaise
  quad(world, W * 2, H, wallMat, [0, H / 2, D1], [0, Math.PI, 0])
  quad(world, W * 2, D1 - D0, mat(0xd9c2a3, { rough: 1 }), [0, H, (D0 + D1) / 2], [Math.PI / 2, 0, 0], { cast: false })
  // poutres et plinthes
  const beamMat = mat(0xffffff, { map: woodTex('#7a4f2e', '40,20,10'), rough: 0.7 })
  for (let z = -2.2; z < D1; z += 1.8) box(world, W * 2, 0.16, 0.2, beamMat, [0, H - 0.08, z], null, { cast: false })
  ;[-W + 0.01, W - 0.01].forEach(x => box(world, 0.03, 0.1, D1 - D0, 0xc79f78, [x, 0.05, (D0 + D1) / 2]))

  // la baie vitrée : un mur presque entièrement vitré
  // derrière la baie : une vraie vue de Manhattan la nuit (vidéo Mixkit, licence libre), en boucle
  const posterTex = new TextureLoader().load('/media/bureau/nyc-night.jpg', t => { t.colorSpace = SRGBColorSpace })
  const outside = quad(world, 20, 11.25, glow(0xffffff, { map: posterTex }), [0, 1.5, -9], null, { receive: false })
  const video = document.createElement('video')
  Object.assign(video, { src: '/media/bureau/nyc-night.mp4', muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', crossOrigin: 'anonymous' })
  video.setAttribute('playsinline', '')
  const videoTex = new VideoTexture(video)
  videoTex.colorSpace = SRGBColorSpace
  video.addEventListener('playing', () => { outside.material.map = videoTex; outside.material.needsUpdate = true }, { once: true })
  video.play().catch(() => addEventListener('pointerdown', () => video.play(), { once: true }))
  // la ville reste en retrait : on assombrit l'image (un peu bleutée, c'est la nuit)
  outside.material.color.setRGB(0.34, 0.35, 0.42)
  const frameMat = mat(0x3a2a20, { rough: 0.5 })
  box(world, W * 2, 0.22, 0.2, frameMat, [0, 0.11, D0])
  box(world, W * 2, 0.3, 0.2, frameMat, [0, H - 0.15, D0])
  for (let x = -W; x <= W + 0.01; x += (W * 2) / 4) box(world, 0.09, H, 0.14, frameMat, [x, H / 2, D0])
  box(world, W * 2, 0.06, 0.12, frameMat, [0, 2.25, D0])
  // vitre (légers reflets)
  quad(world, W * 2, H, new MeshStandardMaterial({ color: 0x9bb6ff, transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0.3 }), [0, H / 2, D0 + 0.02], null, { cast: false, receive: false })
  // rideaux
  const curtainMat = mat(0xb5603a, { rough: 1 })
  ;[-W + 0.35, W - 0.35].forEach(x => {
    for (let k = 0; k < 5; k++) cyl(world, 0.08, 0.1, H - 0.25, curtainMat, [x + (k - 2) * 0.12 * Math.sign(-x), (H - 0.25) / 2, D0 + 0.25 + (k % 2) * 0.05], null, { seg: 10 })
  })
  cyl(world, 0.02, 0.02, W * 2, mat(0x2b2b2b, { metal: 0.6, rough: 0.4 }), [0, H - 0.22, D0 + 0.25], [0, 0, Math.PI / 2])

  // banquette sous la baie, avec coussins
  box(world, 3.6, 0.45, 0.6, mat(0xffffff, { map: woodTex('#8a5a36', '50,26,12') }), [0, 0.225, D0 + 0.42])
  box(world, 3.5, 0.12, 0.58, mat(0xe9d8c2, { rough: 1 }), [0, 0.51, D0 + 0.42], null, { r: 0.05 })
  ;[[1.45, 0xe08a5c], [1.0, 0x8fb39b], [-1.5, 0xf2c38b]].forEach(([x, c]) => box(world, 0.42, 0.38, 0.14, mat(c, { rough: 1 }), [x, 0.74, D0 + 0.28], [0.2, 0, 0.1], { r: 0.08 }))

  // le chat qui dort sur la banquette
  const cat = obj('cat', [-0.95, 0.95, D0 + 0.5], { pos: [-0.6, 1.0, -1.1], look: [-0.95, 0.6, D0 + 0.45] })
  const catMat = mat(0x3b2f2a, { rough: 1 })
  box(cat, 0.5, 0.2, 0.3, catMat, [-0.95, 0.66, D0 + 0.45], [0, -0.3, 0], { r: 0.1 })
  ball(cat, 0.13, catMat, [-0.69, 0.7, D0 + 0.58])
  ;[-0.06, 0.06].forEach(dx => mesh(cat, new ConeGeometry(0.05, 0.1, 8), catMat, [-0.69 + dx, 0.83, D0 + 0.58], [0, 0, dx * -3]))
  mesh(cat, new TorusGeometry(0.16, 0.04, 8, 20, Math.PI), catMat, [-1.13, 0.6, D0 + 0.62], [Math.PI / 2, 0, -0.3])
  // les yeux du chat, qui brillent un peu dans la pénombre (et clignent de temps en temps)
  const catEyes = []
  ;[-1, 1].forEach(sd => {
    const eye = new Group(); eye.position.set(-0.69 + sd * 0.048, 0.725, D0 + 0.58 + 0.118); eye.rotation.y = sd * 0.35; cat.add(eye)
    const iris = ball(eye, 0.024, glow(0xc8d65a), [0, 0, 0], { cast: false, seg: 16 }); iris.scale.set(1, 0.72, 0.45)
    box(eye, 0.007, 0.03, 0.004, glow(0x111111), [0, 0, 0.011], null, { cast: false, r: 0.002 })
    catEyes.push(eye)
  })

  // la guirlande lumineuse en haut de la baie
  const bulbN = 29
  const bulbs = new InstancedMesh(new SphereGeometry(0.022, 8, 6), new MeshBasicMaterial({ toneMapped: false }), bulbN)
  const bulbBase = [], tmpO = new Object3D(), tmpC = new Color()
  for (let i = 0; i < bulbN; i++) {
    const t = i / (bulbN - 1), x = -W + 0.2 + t * (W * 2 - 0.4), y = H - 0.38 - Math.sin(t * Math.PI * 3) ** 2 * 0.22
    tmpO.position.set(x, y, D0 + 0.18); tmpO.updateMatrix(); bulbs.setMatrixAt(i, tmpO.matrix)
    bulbBase.push(new Color(i % 3 ? 0xd9a35c : 0xd97a52))
    bulbs.setColorAt(i, bulbBase[i])
  }
  world.add(bulbs)

  // grand tapis
  quad(world, 3.4, 2.4, mat(0xffffff, { map: rugTex(), rough: 1 }), [0, 0.006, 0.25], [-Math.PI / 2, 0, 0])

  /* ===== le bureau en bois, au centre ===== */
  const deskStart = world.children.length
  const deskWood = mat(0xffffff, { map: woodTex('#a8703f', '70,36,14'), rough: 0.55 })
  box(world, 2.0, 0.06, 0.95, deskWood, [0, 0.76, 0], null, { r: 0.02 })
  ;[-0.85, 0.85].forEach(x => {
    box(world, 0.07, 0.73, 0.07, deskWood, [x, 0.365, -0.38])
    box(world, 0.07, 0.73, 0.07, deskWood, [x, 0.365, 0.38])
    box(world, 0.07, 0.07, 0.76, deskWood, [x, 0.12, 0])
  })
  box(world, 0.55, 0.32, 0.85, deskWood, [0.6, 0.55, 0], null, { r: 0.02 })
  ;[0.62, 0.46].forEach(y => box(world, 0.16, 0.02, 0.02, mat(0xd8b46a, { metal: 0.8, rough: 0.3 }), [0.6, y, 0.43]))

  // panneau de façade du bureau (côté visiteur)
  box(world, 1.62, 0.42, 0.02, deskWood, [0, 0.5, -0.4], null, { r: 0.01 })
  // le fauteuil, derrière le bureau (il ne pivote pas : Yanis s'assoit face à nous, la baie dans le dos)
  const chairStart = world.children.length
  const leather = mat(0x6b3a22, { rough: 0.55 })
  box(world, 0.62, 0.12, 0.58, leather, [0, 0.5, -0.82], null, { r: 0.05 })
  box(world, 0.62, 0.78, 0.12, leather, [0, 0.98, -1.1], [-0.12, 0, 0], { r: 0.06 })
  ;[-0.33, 0.33].forEach(x => box(world, 0.08, 0.22, 0.5, leather, [x, 0.66, -0.85], null, { r: 0.03 }))
  cyl(world, 0.035, 0.035, 0.4, mat(0x2b2b2b, { metal: 0.7, rough: 0.3 }), [0, 0.25, -0.82])
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; box(world, 0.32, 0.03, 0.05, mat(0x2b2b2b, { metal: 0.7, rough: 0.3 }), [Math.cos(a) * 0.16, 0.05, -0.82 + Math.sin(a) * 0.16], [0, -a, 0]) }

  const chairEnd = world.children.length
  // lampe de bureau
  const brass = mat(0xc89a52, { metal: 0.8, rough: 0.3 })
  cyl(world, 0.09, 0.1, 0.025, brass, [0.78, 0.8, -0.28])
  box(world, 0.02, 0.42, 0.02, brass, [0.78, 1.0, -0.28], [0.25, 0, 0])
  cyl(world, 0.05, 0.13, 0.14, mat(0x2f4f3a, { rough: 0.6, extra: { side: 2 } }), [0.78, 1.2, -0.18], [-0.9, 0, 0], { open: true })
  const lampBulb = ball(world, 0.035, glow(0xfff1c9), [0.78, 1.17, -0.14], { cast: false })
  deskLamp.position.set(0.78, 1.16, -0.12)
  deskLamp.target.position.set(0.15, 0.76, 0.2)

  // mug avec vapeur, petite plante
  cyl(world, 0.045, 0.04, 0.1, mat(0xf2ead9, { rough: 0.5 }), [-0.62, 0.84, 0.28])
  mesh(world, new TorusGeometry(0.03, 0.008, 8, 16), mat(0xf2ead9), [-0.575, 0.84, 0.28], [0, 0, Math.PI / 2])
  const steam = []
  // volutes de vapeur : des sprites flous plutôt que des boules
  const puff = canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h) })
  for (let i = 0; i < 7; i++) { const sp = new Sprite(new SpriteMaterial({ map: puff, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, color: 0x8a7f74 })); sp.scale.setScalar(0.05); world.add(sp); steam.push(sp) }
  cyl(world, 0.05, 0.04, 0.08, mat(0xd97757), [-0.85, 0.83, -0.3])
  for (let k = 0; k < 5; k++) mesh(world, new ConeGeometry(0.025, 0.16, 6), mat(0x4caf6a), [-0.85 + (rnd() - 0.5) * 0.06, 0.92, -0.3 + (rnd() - 0.5) * 0.06], [(rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6])

  /* ===== objets interactifs sur le bureau ===== */
  // MacBook, écran tourné vers nous
  const macbook = obj('macbook', [-0.1, 1.12, -0.15], { pos: [-0.1, 1.18, 1.05], look: [-0.1, 0.92, -0.15] })
  const alu = mat(0xc9ccd4, { metal: 0.6, rough: 0.35 })
  box(macbook, 0.46, 0.015, 0.32, alu, [-0.1, 0.795, -0.05], null, { r: 0.008 })
  // clavier (une instance par touche), haut-parleurs et trackpad
  quad(macbook, 0.4, 0.145, mat(0x1b1b1e, { rough: 0.6 }), [-0.1, 0.8028, -0.128], [-Math.PI / 2, 0, 0])
  const keySpots = []
  for (let r = 0; r < 6; r++) {
    const z = -0.188 + r * 0.0235, fn = r === 0
    if (r === 5) {
      ;[[-0.27, 0.03], [-0.234, 0.03], [-0.198, 0.034], [-0.1, 0.15], [-0.002, 0.034], [0.034, 0.03], [0.07, 0.03]].forEach(([x, w]) => keySpots.push([x, z, w, 0.02]))
      continue
    }
    for (let c = 0; c < 14; c++) keySpots.push([-0.1 - 0.182 + c * 0.028 + (r % 2 ? 0.006 : 0), z, 0.024, fn ? 0.011 : 0.02])
  }
  const keys = new InstancedMesh(new BoxGeometry(1, 1, 1), mat(0x2a2a2e, { rough: 0.55 }), keySpots.length)
  keySpots.forEach(([x, z, w, d], i) => { tmpO.position.set(x, 0.8045, z); tmpO.scale.set(w, 0.003, d); tmpO.updateMatrix(); keys.setMatrixAt(i, tmpO.matrix) })
  keys.receiveShadow = true
  macbook.add(keys)
  box(macbook, 0.16, 0.001, 0.095, mat(0xb9bcc4, { metal: 0.5, rough: 0.3 }), [-0.1, 0.8028, 0.035], null, { r: 0.006, cast: false })
  ;[-1, 1].forEach(sd => quad(macbook, 0.03, 0.14, mat(0x8f939b, { rough: 0.7 }), [-0.1 + sd * 0.215, 0.8029, -0.128], [-Math.PI / 2, 0, 0]))
  const lid = new Group(); lid.position.set(-0.1, 0.8, -0.21); lid.rotation.x = -0.22; macbook.add(lid)
  box(lid, 0.46, 0.31, 0.012, alu, [0, 0.155, 0], null, { r: 0.008 })
  const macGlow = quad(lid, 0.43, 0.28, glow(0xffffff, { map: macScreen() }), [0, 0.155, 0.008])
  // le dos de l'écran, tourné vers nous, avec des autocollants
  const sticker = (w, h, draw, pos, rz = 0) => quad(lid, w, h, mat(0xffffff, { map: canvasTex(256, Math.round(256 * h / w), draw), bump: false, rough: 0.5, extra: { transparent: true } }), pos, [0, Math.PI, rz])
  sticker(0.09, 0.09, (g, w, h) => { g.fillStyle = '#fdf6e3'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.ellipse(w * 0.4, h * 0.46, 14, 20, 0, 0, 7); g.ellipse(w * 0.6, h * 0.46, 14, 20, 0, 0, 7); g.fill() }, [0.08, 0.2, -0.0075], 0.2)
  sticker(0.13, 0.045, (g, w, h) => { g.fillStyle = '#ff6fb5'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill(); g.fillStyle = '#fff'; g.font = '800 46px "Bricolage Grotesque", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OsaLabs', w / 2, h / 2 + 2) }, [-0.09, 0.1, -0.0075], -0.15)
  sticker(0.05, 0.05, (g, w, h) => { g.fillStyle = '#ffb35c'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 50 : 120; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r) } g.fill() }, [-0.13, 0.24, -0.0075], 0.3)

  // clavier mécanique PORTFOLIO
  const keyboard = obj('keyboard', [0.25, 0.95, 0.3], { pos: [0.25, 1.15, 0.95], look: [0.25, 0.8, 0.28] })
  box(keyboard, 0.44, 0.03, 0.15, mat(0x2a2733, { rough: 0.5 }), [0.25, 0.805, 0.28], null, { r: 0.01 })
  ;[0xf3a6cf, 0xc4b5fd, 0xa7e8bd, 0xfcc48b, 0x93c5fd, 0xf9a8a8, 0xfde68a, 0xa5b4fc, 0x86efac].forEach((c, i) => {
    const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4
    box(keyboard, 0.055, 0.03, 0.055, mat(c, { rough: 0.6 }), [0.1 + col * 0.068 + (row ? -0.015 : 0.015), 0.83, 0.25 + row * 0.068], null, { r: 0.01 })
  })
  box(keyboard, 0.07, 0.03, 0.12, mat(0xfde68a, { rough: 0.6 }), [0.43, 0.83, 0.28], null, { r: 0.01 })

  // cahier de NSI
  const notebook = obj('notebook', [-0.62, 0.95, 0.05], { pos: [-0.6, 1.2, 0.75], look: [-0.62, 0.8, 0.02] })
  box(notebook, 0.24, 0.02, 0.32, mat(0xf2c94c, { rough: 0.8 }), [-0.62, 0.8, 0.02], [0, 0.35, 0], { r: 0.008 })
  box(notebook, 0.22, 0.012, 0.3, mat(0xfffdf6, { rough: 1 }), [-0.615, 0.789, 0.02], [0, 0.35, 0], { r: 0.004 })
  cyl(notebook, 0.006, 0.006, 0.22, mat(0xf97316), [-0.5, 0.816, 0.08], [Math.PI / 2, 0, 1.1])

  // téléphone
  const phone = obj('phone', [0.62, 0.95, 0.24], { pos: [0.6, 1.15, 0.85], look: [0.62, 0.8, 0.22] })
  const phoneBody = box(phone, 0.09, 0.012, 0.18, mat(0x18181b, { rough: 0.3, metal: 0.4 }), [0.62, 0.797, 0.22], [0, -0.4, 0], { r: 0.012 })
  quad(phoneBody, 0.08, 0.17, glow(0xffffff, { map: phoneScreen() }), [0, 0.007, 0], [-Math.PI / 2, 0, 0])

  // on pivote le bureau et tout ce qui est posé dessus : l'écran regarde Yanis, pas le visiteur
  const deskEnd = world.children.length
  const deskSet = new Group()
  ;[...world.children.slice(deskStart, chairStart), ...world.children.slice(chairEnd, deskEnd)].forEach(o => deskSet.attach(o))
  world.add(deskSet)
  deskSet.rotation.y = Math.PI
  deskSet.updateMatrixWorld(true)
  ;[macbook, keyboard, notebook, phone].forEach(g => deskSet.localToWorld(g.userData.anchor))
  deskLamp.position.set(-0.78, 1.16, 0.12)
  deskLamp.target.position.set(-0.15, 0.76, -0.2)
  // points de vue : depuis le fauteuil pour l'écran et le clavier, depuis le visiteur pour le reste
  macbook.userData.view = { pos: [0.1, 1.24, -0.62], look: [0.1, 0.96, 0.12] }
  keyboard.userData.view = { pos: [-0.25, 1.22, -0.78], look: [-0.25, 0.8, -0.28] }
  notebook.userData.view = { pos: [0.62, 1.25, 0.72], look: [0.62, 0.8, -0.02] }
  phone.userData.view = { pos: [-0.4, 1.18, 0.5], look: [-0.62, 0.8, -0.22] }

  /* ===== mur de gauche : bibliothèque, vieil écran, baladeur, calendrier ===== */
  const shelfWood = mat(0xffffff, { map: woodTex('#8a5a36', '50,26,12'), rough: 0.6 })
  const BX = -W + 0.2
  box(world, 0.4, 2.2, 0.04, shelfWood, [BX, 1.1, -2.72])
  box(world, 0.4, 2.2, 0.04, shelfWood, [BX, 1.1, -1.52])
  ;[0.08, 0.6, 1.1, 1.6, 2.18].forEach(y => box(world, 0.4, 0.035, 1.22, shelfWood, [BX, y, -2.12]))
  const bookCols = [0xb4532a, 0x2f4f3a, 0xe0b04c, 0x6b3a22, 0x3b5b8a, 0xd97757, 0x8fb39b, 0x7a2e1a, 0xf2c38b]
  const bookSpots = []
  ;[[0.1, -2.68, -1.6], [0.62, -1.95, -1.58], [1.12, -2.68, -2.3], [1.62, -2.68, -1.6]].forEach(([y, z0, z1]) => {
    for (let z = z0; z < z1;) { const t = 0.04 + rnd() * 0.04, h = 0.32 + rnd() * 0.14; bookSpots.push([BX + 0.02, y, z, t, h]); z += t + 0.006 }
  })
  addBooks(world, bookSpots, bookCols)
  // plante sur la bibliothèque
  cyl(world, 0.09, 0.07, 0.14, mat(0xd97757), [BX, 2.27, -1.9])
  const smallLeaf = new MeshStandardMaterial({ map: leafTex('#3b7d50', '#62b07a'), alphaTest: 0.5, side: DoubleSide, roughness: 0.6 })
  for (let k = 0; k < 9; k++) { const a = rnd() * 6.28; const l = mesh(world, new PlaneGeometry(0.09, 0.2), smallLeaf, [BX + Math.cos(a) * 0.1, 2.36, -1.9 + Math.sin(a) * 0.1], null); l.rotation.set(-1.0, -a + Math.PI / 2, 0, 'YXZ') }

  const crt = obj('crt', [BX + 0.3, 1.62, -2.0], { pos: [-1.2, 1.45, -1.6], look: [BX, 1.33, -2.0] })
  box(crt, 0.36, 0.32, 0.38, mat(0xd8cfb8, { rough: 0.8 }), [BX, 1.29, -2.0], null, { r: 0.03 })
  quad(crt, 0.27, 0.21, glow(0xffffff, { map: crtScreen() }), [BX + 0.181, 1.3, -2.0], [0, Math.PI / 2, 0])

  const openpod = obj('openpod', [BX + 0.25, 0.98, -2.35], { pos: [-1.45, 0.98, -2.0], look: [BX, 0.74, -2.35] })
  // tout le baladeur dans un seul groupe : l'écran et la molette restent collés à la façade
  const pod = new Group(); pod.position.set(BX + 0.04, 0.725, -2.35); pod.rotation.set(0, 0, 0.16); openpod.add(pod)
  box(pod, 0.035, 0.21, 0.125, mat(0xf2f2f0, { rough: 0.35 }), [0, 0, 0], null, { r: 0.016 })
  box(pod, 0.004, 0.085, 0.1, mat(0x0b0b0c, { rough: 0.2 }), [0.0185, 0.045, 0], null, { r: 0.004, cast: false })
  quad(pod, 0.092, 0.075, glow(0xffffff, { map: podScreen() }), [0.021, 0.045, 0], [0, Math.PI / 2, 0])
  mesh(pod, new TorusGeometry(0.031, 0.011, 10, 32), mat(0xe2e2e0, { rough: 0.45 }), [0.0185, -0.05, 0], [0, Math.PI / 2, 0], { cast: false })
  cyl(pod, 0.016, 0.016, 0.006, mat(0xd4d4d2, { rough: 0.4 }), [0.019, -0.05, 0], [0, 0, Math.PI / 2], { cast: false })

  const calendar = obj('calendar', [-W + 0.15, 2.05, -1.0], { pos: [-1.0, 1.6, -0.6], look: [-W, 1.6, -1.0] })
  box(calendar, 0.02, 0.62, 0.52, mat(0xfffdf8), [-W + 0.012, 1.6, -1.0])
  quad(calendar, 0.5, 0.6, mat(0xffffff, { map: calTex(snapshot?.contributions || []), rough: 0.9 }), [-W + 0.025, 1.6, -1.0], [0, Math.PI / 2, 0])


  /* ===== végétation sur le mur de gauche : guirlande de lierre, lianes et jardinières ===== */
  const ivyMat = new MeshStandardMaterial({ map: ivyTex(), alphaTest: 0.5, side: DoubleSide, roughness: 0.65 })
  const ivy = []
  const leafAt = (y, z, s = 1) => ivy.push([-W + 0.035 + rnd() * 0.06, y, z, (rnd() - 0.5) * 1.2, Math.PI / 2 + (rnd() - 0.5) * 0.9, rnd() * 6.28, s * (0.8 + rnd() * 0.45)])
  const swag = z => 2.74 - Math.abs(Math.sin(((z + 2.95) / 2.6) * Math.PI * 3)) * 0.16
  for (let z = -2.95; z < -0.35; z += 0.018) leafAt(swag(z) + (rnd() - 0.5) * 0.06, z + (rnd() - 0.5) * 0.02)
  // lianes qui retombent (courtes au-dessus de la bibliothèque)
  ;[[-2.55, 0.3], [-2.05, 0.25], [-1.6, 0.42], [-1.38, 0.62], [-0.98, 0.5], [-0.62, 0.7], [-0.42, 0.45]].forEach(([z, len]) => {
    const y0 = swag(z)
    for (let d = 0; d < len; d += 0.045) leafAt(y0 - d, z + Math.sin(d * 9) * 0.015, 1 - d / len * 0.35)
  })
  // deux jardinières murales en terre cuite
  const terracotta = mat(0xb4532a, { rough: 0.85 })
  ;[[-0.5, 1.92, 0.55], [-1.37, 2.02, 0.4]].forEach(([z, y, len]) => {
    box(world, 0.12, 0.12, 0.17, terracotta, [-W + 0.07, y, z], null, { r: 0.02 })
    box(world, 0.13, 0.02, 0.18, mat(0xc8673a, { rough: 0.8 }), [-W + 0.075, y + 0.06, z], null, { r: 0.008 })
    for (let k = 0; k < 16; k++) leafAt(y + 0.08 + rnd() * 0.08, z + (rnd() - 0.5) * 0.2, 1.1)
    ;[-0.06, 0, 0.06].forEach((dz, j) => { const l = len * (0.7 + j * 0.15); for (let d = 0; d < l; d += 0.04) leafAt(y + 0.02 - d, z + dz + Math.sin(d * 8 + j) * 0.018, 1 - d / l * 0.3) })
  })
  addLeaves(world, ivyMat, ivy, [0.075, 0.075])

  /* ===== meuble bas et tourne-disque (mur de gauche) ===== */
  const sideWood = mat(0xffffff, { map: woodTex('#7a4f2e', '45,22,10'), rough: 0.5 })
  const TX = -W + 0.26
  box(world, 0.46, 0.62, 1.0, sideWood, [TX, 0.36, -0.75], null, { r: 0.015 })
  ;[[-1.12], [-0.38]].forEach(([z]) => box(world, 0.03, 0.06, 0.03, mat(0x2b2b2b), [TX, 0.03, z]))
  box(world, 0.005, 0.5, 0.46, mat(0x5a3820, { rough: 0.6 }), [TX + 0.232, 0.36, -0.98], null, { r: 0.002 })
  box(world, 0.005, 0.5, 0.46, mat(0x5a3820, { rough: 0.6 }), [TX + 0.232, 0.36, -0.5], null, { r: 0.002 })
  ;[-0.98, -0.5].forEach(z => box(world, 0.02, 0.02, 0.12, brass, [TX + 0.245, 0.45, z]))
  // vinyles rangés dans le meuble (on voit les tranches)
  const sleeveCols = [0xe0b04c, 0x2f4f3a, 0xb4532a, 0x3b5b8a, 0xf2ead9, 0x8f3a3a]
  for (let k = 0; k < 9; k++) box(world, 0.3, 0.3, 0.012, mat(sleeveCols[k % sleeveCols.length], { rough: 0.8 }), [TX + 0.05, 0.86 + 0.0, -1.12 + k * 0.016], [0, 0, 0.08], { r: 0.003 })

  const turntable = obj('turntable', [TX + 0.1, 1.05, -0.62], { pos: [TX + 0.06, 1.32, -0.5], look: [TX - 0.01, 0.74, -0.64] })
  box(turntable, 0.4, 0.07, 0.34, mat(0xffffff, { map: woodTex('#a8703f', '70,36,14'), rough: 0.45 }), [TX, 0.705, -0.62], null, { r: 0.012 })
  box(turntable, 0.39, 0.012, 0.33, new MeshStandardMaterial({ color: 0x99a, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.4 }), [TX, 0.83, -0.62], null, { r: 0.01, cast: false })
  const platter = new Group(); platter.position.set(TX - 0.03, 0.745, -0.64); turntable.add(platter)
  cyl(platter, 0.14, 0.14, 0.012, mat(0x2b2b2b, { metal: 0.6, rough: 0.35 }), [0, 0, 0], null, { seg: 48 })
  cyl(platter, 0.13, 0.13, 0.004, mat(0x111111, { rough: 0.25 }), [0, 0.008, 0], null, { seg: 48 })
  for (let r = 0.06; r < 0.13; r += 0.012) mesh(platter, new TorusGeometry(r, 0.0006, 4, 48), mat(0x2e2e2e, { rough: 0.2 }), [0, 0.0105, 0], [Math.PI / 2, 0, 0], { cast: false })
  const recordLabel = cyl(platter, 0.045, 0.045, 0.005, mat(0xd4573a, { rough: 0.7 }), [0, 0.011, 0], null, { seg: 32 })
  ball(platter, 0.006, mat(0xd8d8d8, { metal: 0.9, rough: 0.2 }), [0, 0.016, 0], { cast: false })
  const arm = new Group(); arm.position.set(TX + 0.12, 0.765, -0.5); turntable.add(arm)
  cyl(arm, 0.018, 0.018, 0.03, mat(0xc0c0c0, { metal: 0.9, rough: 0.25 }), [0, 0, 0])
  box(arm, 0.008, 0.008, 0.2, mat(0xc8c8c8, { metal: 0.9, rough: 0.25 }), [0, 0.02, -0.1], null, { r: 0.003 })
  box(arm, 0.02, 0.012, 0.03, mat(0x222222), [0, 0.016, -0.2], null, { r: 0.003 })
  arm.rotation.y = -0.05
  // la pochette du disque en cours, posée au sol et appuyée contre la façade du meuble
  const sleeveRest = new Group()
  sleeveRest.position.set(TX + 0.2295 + 0.3 * Math.sin(0.2) + 0.005, 0, -0.72)
  sleeveRest.rotation.set(-0.2, Math.PI / 2, 0, 'YXZ')
  turntable.add(sleeveRest)
  box(sleeveRest, 0.3, 0.3, 0.008, mat(0x1d1d22, { rough: 0.7 }), [0, 0.15, 0], null, { r: 0.002 })
  const sleeveArt = quad(sleeveRest, 0.296, 0.296, mat(0xffffff, { map: canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b1a14'); gr.addColorStop(1, '#8a5a36'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f2ead9'; g.font = '700 46px "Instrument Serif", serif'; g.textAlign = 'center'; g.fillText('Soul', w / 2, h * 0.6); g.font = '600 18px "JetBrains Mono", monospace'; g.fillText('SEAL', w / 2, h * 0.75) }), bump: false, rough: 0.6 }), [0, 0.15, 0.0045])

  // lampadaire en arc, devant à gauche
  cyl(world, 0.16, 0.18, 0.03, mat(0x2b2b2b, { metal: 0.5, rough: 0.4 }), [-1.6, 0.015, -1.45])
  cyl(world, 0.018, 0.018, 1.8, brass, [-1.6, 0.9, -1.45])
  mesh(world, new TorusGeometry(0.6, 0.018, 8, 24, Math.PI / 2), brass, [-1.0, 1.8, -1.45], [0, 0, Math.PI / 2])
  cyl(world, 0.08, 0.22, 0.18, mat(0xf2e6cf, { rough: 0.9, extra: { side: 2 } }), [-1.0, 2.3, -1.45], null, { open: true })
  ball(world, 0.05, glow(0xfff1c9), [-1.0, 2.25, -1.45], { cast: false })
  floorLampL.position.set(-1.0, 2.1, -1.45)

  // grande plante dans le coin du fond (feuilles découpées)
  const leafMats = [leafTex('#2f6b45', '#4c9a63'), leafTex('#3b7d50', '#62b07a')].map(t => new MeshStandardMaterial({ map: t, alphaTest: 0.5, side: DoubleSide, roughness: 0.6 }))
  cyl(world, 0.22, 0.17, 0.42, mat(0xffffff, { map: woodTex('#b4532a', '80,30,10'), bumpScale: 0.4 }), [2.2, 0.21, -2.65])
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * 6.28 + rnd() * 0.3, hgt = 0.7 + rnd() * 0.75
    cyl(world, 0.006, 0.008, hgt, mat(0x3f6b3a), [2.2 + Math.cos(a) * 0.05, 0.42 + hgt / 2, -2.65 + Math.sin(a) * 0.05], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25], { cast: false })
    const leaf = mesh(world, new PlaneGeometry(0.34, 0.6), leafMats[k % 2], [2.2 + Math.cos(a) * 0.28, 0.42 + hgt, -2.65 + Math.sin(a) * 0.28], null)
    leaf.rotation.set(-0.9 - rnd() * 0.4, -a + Math.PI / 2, 0, 'YXZ')
  }

  /* ===== mur de droite : cheminée et piano, néon, horloge, portrait, discothèque ===== */
  const RW = W - 0.01
  const shelfLeaf = new MeshStandardMaterial({ map: leafTex('#3b7d50', '#62b07a'), alphaTest: 0.5, side: DoubleSide, roughness: 0.6 })

  // la cheminée, derrière le piano : briques, manteau en bois, vrai feu qui vacille
  const FZ = -1.8
  const brick = mat(0xffffff, { map: brickTex(), rough: 0.9, bumpScale: 0.8 })
  ;[-1, 1].forEach(sd => box(world, 0.24, 1.05, 0.175, brick, [W - 0.12, 0.525, FZ + sd * 0.3875], null, { r: 0.01 }))
  box(world, 0.24, 0.45, 0.6, brick, [W - 0.12, 0.825, FZ], null, { r: 0.01 })
  box(world, 0.02, 0.5, 0.6, mat(0x140d0a, { rough: 1 }), [W - 0.015, 0.35, FZ], null, { cast: false })
  box(world, 0.24, 0.08, 0.6, mat(0x1e1612, { rough: 1 }), [W - 0.12, 0.06, FZ], null, { cast: false })
  const mantelWood = mat(0xffffff, { map: woodTex('#6b4226', '40,20,10'), rough: 0.55 })
  box(world, 0.32, 0.05, 1.1, mantelWood, [W - 0.16, 1.075, FZ], null, { r: 0.01 })
  box(world, 0.42, 0.04, 1.1, mat(0x3a302b, { rough: 0.8 }), [W - 0.21, 0.02, FZ], null, { r: 0.008 })
  // les bûches et les braises
  const ember = mat(0x3a2015, { rough: 0.9, emissive: 0xff5a1a, ei: 0.55 })
  cyl(world, 0.035, 0.035, 0.42, ember, [W - 0.12, 0.135, FZ - 0.02], [Math.PI / 2, 0.15, 0], { seg: 10, cast: false })
  cyl(world, 0.03, 0.03, 0.36, ember, [W - 0.15, 0.18, FZ + 0.03], [Math.PI / 2, -0.45, 0], { seg: 10, cast: false })
  const flameTex = canvasTex(64, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.78, 2, w / 2, h * 0.7, h * 0.62)
    gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.25, 'rgba(255,170,60,.9)'); gr.addColorStop(0.6, 'rgba(230,80,20,.35)'); gr.addColorStop(1, 'rgba(200,40,10,0)')
    g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 4); g.bezierCurveTo(w * 0.95, h * 0.5, w, h * 0.95, w / 2, h - 2); g.bezierCurveTo(0, h * 0.95, w * 0.05, h * 0.5, w / 2, 4); g.fill()
  })
  const flames = [-0.15, -0.075, 0, 0.075, 0.15].map((dz, i) => {
    const f = new Sprite(new SpriteMaterial({ map: flameTex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }))
    f.userData = { dz, h: 0.2 + (2 - Math.abs(i - 2)) * 0.05, seed: i * 1.7 }
    f.position.set(W - 0.12, 0.2, FZ + dz); world.add(f)
    return f
  })
  fireL.position.set(W - 0.42, 0.4, FZ)

  // sur le manteau : livres, enceinte, petit cadre, plante
  const shelfBooks = []
  for (let z = FZ - 0.5; z < FZ - 0.2;) { const t = 0.03 + rnd() * 0.03, h = 0.18 + rnd() * 0.08; shelfBooks.push([RW - 0.13, 1.1, z, t, h]); z += t + 0.004 }
  addBooks(world, shelfBooks, bookCols)
  box(world, 0.12, 0.17, 0.12, mat(0x2a2a2e, { rough: 0.6 }), [RW - 0.12, 1.185, FZ - 0.05], null, { r: 0.015 })
  cyl(world, 0.035, 0.035, 0.005, mat(0x555555, { metal: 0.6, rough: 0.4 }), [RW - 0.182, 1.2, FZ - 0.05], [0, 0, Math.PI / 2])
  box(world, 0.01, 0.2, 0.16, mat(0x111111, { rough: 0.3 }), [RW - 0.06, 1.2, FZ + 0.17], [0, 0, -0.1], { r: 0.003 })
  cyl(world, 0.045, 0.035, 0.07, mat(0xd97757), [RW - 0.13, 1.135, FZ + 0.4])
  for (let k = 0; k < 6; k++) { const a = rnd() * 6.28; const l = mesh(world, new PlaneGeometry(0.06, 0.14), shelfLeaf, [RW - 0.13 + Math.cos(a) * 0.04, 1.22, FZ + 0.4 + Math.sin(a) * 0.04], null); l.rotation.set(-0.9, -a + Math.PI / 2, 0, 'YXZ') }

  // le piano, devant la cheminée
  const PZ = -1.82
  const piano = obj('piano', [W - 0.5, 1.15, PZ], { pos: [1.1, 1.5, PZ + 0.75], look: [W - 0.45, 0.8, PZ] })
  box(piano, 0.32, 0.08, 1.2, mat(0x1c1c1f, { rough: 0.4 }), [W - 0.45, 0.85, PZ], null, { r: 0.015 })
  box(piano, 0.13, 0.02, 1.12, mat(0xfafafa, { rough: 0.5 }), [W - 0.56, 0.9, PZ], null, { r: 0.004 })
  for (let o = 0; o < 3; o++) [0, 1, 3, 4, 5].forEach(b => box(piano, 0.07, 0.022, 0.035, mat(0x111111), [W - 0.53, 0.915, PZ - 0.54 + (o * 7 + b) * 0.051 + 0.026], null, { r: 0.003 }))
  ;[PZ - 0.45, PZ + 0.45].forEach(z => {
    box(piano, 0.03, 0.85, 0.03, mat(0x2b2b2b, { metal: 0.6, rough: 0.4 }), [W - 0.45, 0.42, z], [0.35, 0, 0])
    box(piano, 0.03, 0.85, 0.03, mat(0x2b2b2b, { metal: 0.6, rough: 0.4 }), [W - 0.45, 0.42, z], [-0.35, 0, 0])
  })

  const neon = obj('neon', [W - 0.2, 2.35, -1.75], { pos: [1.0, 2.0, -0.9], look: [W, 2.0, -1.75] })
  box(neon, 0.04, 0.42, 1.25, mat(0x1a1424, { rough: 0.5 }), [W - 0.02, 2.0, -1.75], null, { r: 0.04 })
  const neonGlow = quad(neon, 1.35, 0.4, glow(0xffffff, { map: neonTex(), transparent: true }), [W - 0.05, 2.0, -1.75], [0, -Math.PI / 2, 0])

  // horloge au-dessus du néon
  const clock = new Group(); clock.position.set(RW - 0.03, 2.52, -1.75); clock.rotation.y = -Math.PI / 2; world.add(clock)
  cyl(clock, 0.15, 0.15, 0.04, mat(0x2a1b13, { rough: 0.5 }), [0, 0, 0], [Math.PI / 2, 0, 0], { seg: 32 })
  cyl(clock, 0.13, 0.13, 0.045, mat(0xf3ead9, { rough: 0.8 }), [0, 0, 0.002], [Math.PI / 2, 0, 0], { seg: 32 })
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; box(clock, 0.006, k % 3 ? 0.012 : 0.022, 0.004, mat(0x2a1b13), [Math.sin(a) * 0.11, Math.cos(a) * 0.11, 0.026], [0, 0, -a], { cast: false }) }
  const hourHand = box(clock, 0.008, 0.065, 0.004, mat(0x2a1b13), [0, 0, 0.03], null, { cast: false })
  const minHand = box(clock, 0.005, 0.095, 0.004, mat(0xb4532a), [0, 0, 0.032], null, { cast: false })
  hourHand.geometry.translate(0, 0.028, 0); minHand.geometry.translate(0, 0.042, 0)

  // le portrait, en grand, avec sa petite lampe de tableau
  const VZ = -0.74
  const frameObj = obj('frame', [W - 0.15, 2.32, VZ], { pos: [1.05, 1.85, -0.15], look: [W, 1.88, VZ] })
  box(frameObj, 0.045, 0.94, 0.76, mat(0xd8b46a, { metal: 0.5, rough: 0.4 }), [W - 0.025, 1.9, VZ], null, { r: 0.012 })
  quad(frameObj, 0.66, 0.84, mat(0xf3ead9, { rough: 0.9 }), [W - 0.049, 1.9, VZ], [0, -Math.PI / 2, 0])
  const photo = quad(frameObj, 0.56, 0.72, mat(0xf9a8a8, { rough: 0.6 }), [W - 0.05, 1.9, VZ], [0, -Math.PI / 2, 0])
  // la matière est clonée plus bas (surbrillance au survol) : on vise celle du mesh. La photo carrée est recadrée au centre.
  if (avatar) new TextureLoader().setCrossOrigin('anonymous').load(avatar, t => {
    t.colorSpace = SRGBColorSpace; t.repeat.set(0.56 / 0.72, 1); t.offset.set((1 - 0.56 / 0.72) / 2, 0)
    photo.material.map = t; photo.material.color.set(0xffffff); photo.material.needsUpdate = true
  })
  box(world, 0.11, 0.015, 0.015, brass, [W - 0.055, 2.43, VZ], null, { cast: false })
  cyl(world, 0.022, 0.022, 0.42, brass, [W - 0.11, 2.43, VZ], [Math.PI / 2, 0, 0], { cast: false })
  box(world, 0.006, 0.006, 0.38, glow(0xffe2b0), [W - 0.11, 2.408, VZ], null, { cast: false, r: 0.002 })
  const poolTex = canvasTex(128, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, -h * 0.15, 4, w / 2, -h * 0.1, h * 0.95); gr.addColorStop(0, 'rgba(255,214,150,.75)'); gr.addColorStop(0.5, 'rgba(255,190,120,.22)'); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h) })
  quad(world, 0.8, 1.0, new MeshBasicMaterial({ map: poolTex, blending: AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }), [W - 0.054, 1.93, VZ], [0, -Math.PI / 2, 0], { receive: false })

  /* ===== la discothèque : un meuble à cases rempli de vinyles, sous le portrait ===== */
  const vinyls = obj('vinyls', [W - 0.25, 1.35, VZ], { pos: [1.15, 1.12, -0.25], look: [W - 0.2, 0.98, VZ] })
  const caseWood = mat(0xffffff, { map: woodTex('#b98a5a', '80,45,20'), rough: 0.6 })
  ;[-0.435, 0, 0.435].forEach(dz => box(vinyls, 0.4, 1.265, 0.03, caseWood, [W - 0.2, 0.6325, VZ + dz], null, { r: 0.006 }))
  for (let k = 0; k < 4; k++) box(vinyls, 0.4, 0.03, 0.9, caseWood, [W - 0.2, 0.035 + k * 0.405, VZ], null, { r: 0.006 })
  box(vinyls, 0.01, 1.24, 0.88, caseWood, [W - 0.006, 0.63, VZ], null, { cast: false })
  const rowY = k => 0.05 + k * 0.405, cubeZ = c => VZ + (c ? 0.2175 : -0.2175)
  // rangée du milieu : des livres et une enceinte ; en bas : l'ampli et une pile de disques
  const caseBooks = []
  for (let z = cubeZ(0) - 0.19; z < cubeZ(0) + 0.17;) { const t = 0.035 + rnd() * 0.035, h = 0.24 + rnd() * 0.1; caseBooks.push([W - 0.2, rowY(1), z, t, h]); z += t + 0.005 }
  addBooks(vinyls, caseBooks, bookCols)
  box(vinyls, 0.22, 0.28, 0.18, mat(0x3a2418, { rough: 0.5 }), [W - 0.22, rowY(1) + 0.14, cubeZ(1) - 0.06], null, { r: 0.012 })
  cyl(vinyls, 0.055, 0.055, 0.01, mat(0x1a1a1a, { rough: 0.8 }), [W - 0.335, rowY(1) + 0.12, cubeZ(1) - 0.06], [0, 0, Math.PI / 2], { cast: false })
  cyl(vinyls, 0.022, 0.022, 0.01, mat(0x1a1a1a, { rough: 0.8 }), [W - 0.335, rowY(1) + 0.23, cubeZ(1) - 0.06], [0, 0, Math.PI / 2], { cast: false })
  cyl(vinyls, 0.04, 0.032, 0.07, terracotta, [W - 0.22, rowY(1) + 0.035, cubeZ(1) + 0.11])
  for (let k = 0; k < 5; k++) { const a = rnd() * 6.28; const l = mesh(vinyls, new PlaneGeometry(0.05, 0.12), shelfLeaf, [W - 0.22 + Math.cos(a) * 0.03, rowY(1) + 0.11, cubeZ(1) + 0.11 + Math.sin(a) * 0.03], null); l.rotation.set(-0.8, -a + Math.PI / 2, 0, 'YXZ') }
  box(vinyls, 0.34, 0.13, 0.36, mat(0x2a2a2e, { rough: 0.4, metal: 0.3 }), [W - 0.2, rowY(0) + 0.065, cubeZ(0)], null, { r: 0.01 })
  quad(vinyls, 0.09, 0.05, glow(0xffb35c), [W - 0.372, rowY(0) + 0.075, cubeZ(0) - 0.08], [0, -Math.PI / 2, 0])
  ;[0.02, 0.09, 0.15].forEach(dz => cyl(vinyls, 0.016, 0.016, 0.02, mat(0xc8c8c8, { metal: 0.8, rough: 0.3 }), [W - 0.375, rowY(0) + 0.065, cubeZ(0) + dz], [0, 0, Math.PI / 2], { cast: false }))
  for (let k = 0; k < 9; k++) box(vinyls, 0.31, 0.012, 0.31, mat([0x1d1d22, 0xe0b04c, 0x2f4f3a, 0x8f3a3a, 0xf2ead9][k % 5], { rough: 0.8 }), [W - 0.21, rowY(0) + 0.006 + k * 0.013, cubeZ(1)], [0, (rnd() - 0.5) * 0.18, 0], { r: 0.002 })
  // dessus du meuble : deux bougies et une petite plante retombante
  ;[0.26, 0.33].forEach((dz, i) => { cyl(vinyls, 0.025, 0.025, 0.09 + i * 0.04, mat(0xf3ead9, { rough: 0.8 }), [W - 0.2, 1.31 + i * 0.02, VZ + dz]); ball(vinyls, 0.01, glow(0xffc46b), [W - 0.2, 1.37 + i * 0.04, VZ + dz], { cast: false, seg: 8 }) })
  cyl(vinyls, 0.06, 0.045, 0.09, terracotta, [W - 0.2, 1.31, VZ - 0.3])
  const topIvy = []
  for (let k = 0; k < 14; k++) topIvy.push([W - 0.2 + (rnd() - 0.5) * 0.1, 1.37 + rnd() * 0.05, VZ - 0.3 + (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 1.2, rnd() * 6.28, rnd() * 6.28, 0.9])
  for (let d = 0; d < 0.5; d += 0.04) topIvy.push([W - 0.39 - rnd() * 0.02, 1.3 - d, VZ - 0.33 + Math.sin(d * 9) * 0.02, 0, -Math.PI / 2 + (rnd() - 0.5) * 0.6, rnd() * 6.28, 0.9 - d * 0.5])
  addLeaves(vinyls, ivyMat, topIvy, [0.07, 0.07])

  // rangée du haut : les vinyles qu'on peut sortir, la tranche vers la pièce
  const drawSpine = (g, w, h, r, bg = r.spine, ink = r.ink) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h)
    g.save(); g.translate(w / 2 + 6, h / 2); g.rotate(-Math.PI / 2); g.fillStyle = ink; g.textAlign = 'center'
    g.font = '700 17px "Bricolage Grotesque", sans-serif'; g.fillText(`${r.artist.toUpperCase()} · ${r.title}`.slice(0, 40), 0, 0); g.restore()
  }
  const spineTex = r => canvasTex(32, 512, (g, w, h) => drawSpine(g, w, h, r))
  // couleur moyenne d'une pochette (pour peindre la tranche et les bords du disque)
  const avgColor = img => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 8
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 8, 8)
      const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0
      for (let k = 0; k < d.length; k += 4) { r += d[k]; gg += d[k + 1]; b += d[k + 2] }
      const n = d.length / 4; return [r / n, gg / n, b / n].map(v => Math.round(v * 0.8))
    } catch { return null }
  }
  const coverTex = r => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = r.spine; g.fillRect(0, 0, w, h); g.fillStyle = r.ink; g.textAlign = 'center'
    g.font = '700 30px "Instrument Serif", serif'; g.fillText(r.album.slice(0, 18), w / 2, h * 0.5)
    g.font = '600 15px "JetBrains Mono", monospace'; g.fillText(r.artist.toUpperCase(), w / 2, h * 0.64)
  })
  const sleeveGeo = new BoxGeometry(0.31, 0.31, 0.016)
  const crate = RECORDS.map((r, i) => {
    const g = new Group()
    // sept disques par case, sur la rangée du haut
    const c = i < 7 ? 0 : 1, j = i % 7
    const base = new Vector3(W - 0.215, rowY(2) + 0.158, cubeZ(c) - 0.165 + j * 0.052)
    g.position.copy(base); vinyls.add(g)
    const edge = mat(r.spine, { rough: 0.8 }), front = mat(0xffffff, { map: coverTex(r), bump: false, rough: 0.6 })
    const spine = mat(0xffffff, { map: spineTex(r), bump: false, rough: 0.7 }), back = mat(r.spine, { rough: 0.8 })
    const sleeve = new Mesh(sleeveGeo, [edge, spine, edge, edge, front, back])
    sleeve.castShadow = sleeve.receiveShadow = true; g.add(sleeve)
    const disc = new Group(); g.add(disc)
    cyl(disc, 0.145, 0.145, 0.003, mat(0x111111, { rough: 0.25 }), [0, 0, 0], [Math.PI / 2, 0, 0], { seg: 48, cast: false })
    const label = cyl(disc, 0.048, 0.048, 0.0034, mat(r.spine, { rough: 0.7 }), [0, 0, 0], [Math.PI / 2, 0, 0], { seg: 32, cast: false })
    return { g, sleeve, disc, label, front, spine, edge, back, base, p: 0, peek: 0 }
  })
  vinyls.updateMatrixWorld(true)
  // point de présentation : le disque sorti flotte face à la caméra, devant le meuble
  const vView = vinyls.userData.view
  const vCam = new Vector3(...vView.pos), present = vCam.clone().add(new Vector3(...vView.look).sub(vCam).normalize().multiplyScalar(0.9))
  const presentYaw = Math.atan2(vCam.x - present.x, vCam.z - present.z)
  let hovRec = -1, selRec = -1, onPlatter = 0
  const arts = []

  // plante suspendue au plafond
  cyl(world, 0.003, 0.003, 0.6, mat(0x8a6a4a), [-1.95, H - 0.3, -2.45], null, { cast: false })
  cyl(world, 0.11, 0.08, 0.12, mat(0xf2ead9, { rough: 0.6 }), [-1.95, H - 0.66, -2.45])
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 6.28, len = 0.25 + rnd() * 0.35
    const vine = mesh(world, new PlaneGeometry(0.08, len), shelfLeaf, [-1.95 + Math.cos(a) * 0.1, H - 0.7 - len / 2, -2.45 + Math.sin(a) * 0.1], null, { cast: false })
    vine.rotation.set(0, -a, 0)
  }

  const server = obj('server', [1.3, 0.9, -1.0], { pos: [1.8, 0.85, 0.2], look: [1.3, 0.36, -1.0] })
  box(server, 0.26, 0.62, 0.42, mat(0x3a3f4a, { rough: 0.35, metal: 0.55 }), [1.3, 0.31, -1.0], [0, -0.25, 0], { r: 0.02 })
  // façade : baies de disques, grille d'aération, étiquette et LED
  const front = new Group()
  front.position.set(1.3 + 0.211 * Math.sin(-0.25), 0, -1.0 + 0.211 * Math.cos(-0.25))
  front.rotation.y = -0.25
  server.add(front)
  box(front, 0.22, 0.58, 0.008, mat(0x23262d, { rough: 0.4, metal: 0.5 }), [0, 0.31, 0], null, { r: 0.004 })
  for (let k = 0; k < 3; k++) {
    box(front, 0.18, 0.055, 0.012, mat(0x4b5563, { rough: 0.35, metal: 0.6 }), [0, 0.53 - k * 0.075, 0.006], null, { r: 0.004 })
    box(front, 0.12, 0.008, 0.014, mat(0x111318), [-0.01, 0.53 - k * 0.075, 0.008], null, { r: 0.002, cast: false })
  }
  for (let k = 0; k < 7; k++) box(front, 0.17, 0.006, 0.012, mat(0x111318), [0, 0.2 - k * 0.022, 0.006], null, { r: 0.002, cast: false })
  quad(front, 0.08, 0.03, mat(0xffffff, { map: canvasTex(160, 60, (g, w, h) => { g.fillStyle = '#e57000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 30px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText('PVE', w / 2, 41) }), bump: false }), [0.05, 0.28, 0.0075])
  const leds = []
  for (let k = 0; k < 5; k++) leds.push(ball(front, 0.007, glow(k % 2 ? 0x86efac : 0x60a5fa), [-0.07 + k * 0.022, 0.295, 0.009], { cast: false, seg: 8 }))
  // la tour éclaire un peu le sol devant elle

  // suspension au-dessus du bureau
  cyl(world, 0.004, 0.004, 0.95, mat(0x222222), [0, H - 0.47, 0.05], null, { cast: false })
  cyl(world, 0.06, 0.2, 0.18, mat(0x2f4f3a, { rough: 0.5, extra: { side: 2 } }), [0, H - 1.02, 0.05], null, { open: true, cast: false })
  ball(world, 0.04, glow(0xfff1c9), [0, H - 1.06, 0.05], { cast: false })
  pendantL.position.set(0, H - 1.15, 0.05)

  // poussière qui flotte dans la lumière
  const dustGeo = new BufferGeometry()
  const dustN = 110, dustPos = new Float32Array(dustN * 3)
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (rnd() - 0.5) * 3.2; dustPos[i * 3 + 1] = 0.3 + rnd() * 2.4; dustPos[i * 3 + 2] = -1.8 + rnd() * 3.4 }
  dustGeo.setAttribute('position', new Float32BufferAttribute(dustPos, 3))
  const dust = new Points(dustGeo, new PointsMaterial({ color: 0xffd9a0, size: 0.012, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }))
  world.add(dust)

  /* ---------- la mascotte ---------- */
  const mascot = new Group()
  const body = ball(mascot, 0.075, mat(0xfdf6e3, { rough: 0.6, emissive: 0x6b6250, ei: 0.6 }), [0, 0, 0], { cast: false })
  const eyes = new Group()
  ;[-0.035, 0.035].forEach(x => {
    const e = new Mesh(new SphereGeometry(0.018, 12, 12), new MeshBasicMaterial({ color: 0x111111 }))
    e.scale.set(0.8, 1.2, 0.6); e.position.set(x * 0.7, 0.01, 0.068)
    eyes.add(e)
  })
  body.add(eyes)
  const homeMascot = new Vector3(-0.42, 1.0, 0.32)
  mascot.position.copy(homeMascot)
  scene.add(mascot)

  /* ---------- halos : de simples sprites autour des ampoules (bien moins coûteux qu'un post-traitement) ---------- */
  const haloTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,214,150,.55)'); r.addColorStop(0.35, 'rgba(255,170,90,.18)'); r.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h) })
  const halos = []
  ;[[-0.78, 1.17, 0.14, 0.35], [-1.0, 2.25, -1.45, 0.6], [0, H - 1.06, 0.05, 0.5]].forEach(([x, y, z, sz]) => {
    const h = new Sprite(new SpriteMaterial({ map: haloTex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }))
    h.position.set(x, y, z); h.scale.setScalar(sz); h.userData.base = sz; world.add(h); halos.push(h)
  })

  // halo du feu, qui vacille avec la lumière
  const fireHalo = new Sprite(new SpriteMaterial({ map: haloTex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }))
  fireHalo.position.set(W - 0.25, 0.32, FZ); fireHalo.scale.setScalar(0.9); world.add(fireHalo)

  /* ---------- toujours la nuit : une ambiance tamisée ---------- */
  sky.color.set(0x9db4ff); sky.intensity = 0.75
  hemi.intensity = 0.2
  deskLamp.intensity = 2.3
  floorLampL.intensity = 0.95
  pendantL.intensity = 0.8
  renderer.toneMappingExposure = 0.86
  scene.environmentIntensity = 0.1

  /* ---------- caméra ---------- */
  const HOME = { pos: new Vector3(0, 1.5, 3.2), look: new Vector3(0, 1.1, -1.0) }
  const cam = { pos: HOME.pos.clone(), look: HOME.look.clone() }
  const goal = { pos: HOME.pos.clone(), look: HOME.look.clone() }
  let focusedNow = null, camEase = 0.002
  let yaw = 0, pitch = 0, gYaw = 0, gPitch = 0, fovK = 1, gFovK = 1, shift = 0, shiftY = 0
  const mouse = new Vector2()
  addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)) }, { passive: true })

  let W2 = 1, H2 = 1
  function resize() {
    W2 = canvas.clientWidth; H2 = canvas.clientHeight
    // en portrait, on se rapproche du bureau
    const portrait = W2 < H2
    HOME.pos.set(0, portrait ? 1.35 : 1.5, portrait ? 2.1 : 3.2)
    HOME.look.set(0, portrait ? 1.0 : 1.1, -1.0)
    if (!focusedNow) { goal.pos.copy(HOME.pos); goal.look.copy(HOME.look) }
    renderer.setSize(W2, H2, false)
    camera.aspect = W2 / H2
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(canvas)
  resize()

  const tmp = new Vector3(), lookV = new Vector3()
  function placeCamera() {
    // champ horizontal constant : la pièce remplit l'écran, même en portrait
    const hFov = (camera.aspect < 1 ? 62 : 72) / fovK
    camera.fov = MathUtils.clamp(2 * Math.atan(Math.tan(MathUtils.degToRad(hFov) / 2) / camera.aspect) * 180 / Math.PI, 30, 100)
    camera.position.copy(cam.pos)
    lookV.copy(cam.look).sub(cam.pos)
    lookV.applyAxisAngle(new Vector3(0, 1, 0), yaw)
    lookV.y += pitch * lookV.length()
    camera.lookAt(tmp.copy(cam.pos).add(lookV))
    // décalage de l'image quand le panneau est ouvert : l'objet reste visible à gauche
    if (shift > 0.001 || shiftY > 0.001) camera.setViewOffset(W2, H2, shift * W2, shiftY * H2, W2, H2)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }

  /* ---------- survol & sélection ---------- */
  const ray = new Raycaster()
  const ptr = new Vector2()
  const pickables = []
  const mats = {}
  Object.values(objects).forEach(g => {
    mats[g.userData.id] = []
    g.traverse(m => {
      if (!m.isMesh) return
      pickables.push(m)
      if (m.material.isMeshStandardMaterial) { m.material = m.material.clone(); mats[g.userData.id].push(m.material) }
    })
  })
  const findObj = m => { while (m && !m.userData?.anchor) m = m.parent; return m }
  function pick(x, y) {
    const r = canvas.getBoundingClientRect()
    ptr.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ptr, camera)
    const hit = ray.intersectObjects(pickables, false)[0]
    return hit ? findObj(hit.object)?.userData.id : null
  }
  let hovered = null
  const warm = new Color(0xff8a3d)
  function paint() {
    Object.entries(mats).forEach(([id, list]) => list.forEach(m => {
      const on = id === hovered && id !== api.focused
      m.emissive.copy(on ? warm : new Color(0x000000))
      m.emissiveIntensity = on ? 0.3 : 1
    }))
  }

  /* ---------- boucle ---------- */
  const mGoal = homeMascot.clone()
  let t = 0, last = performance.now(), music = false, armK = 0, frozen = false, frameN = 0, slowAcc = 0, slowN = 0
  const listeners = []
  function frame(now) {
    const raw = (now - last) / 1000
    const dt = Math.min(0.05, raw)
    last = now; t += dt; frameN++
    // qualité adaptative : si l'appareil peine (moins de ~45 images/s), on baisse la résolution puis le halo
    if (!still && frameN > 30 && raw < 0.5) {
      slowAcc += raw; slowN++
      if (slowN === 60) {
        if (slowAcc / slowN > 1 / 45) {
          if (dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); resize() }
        }
        slowAcc = 0; slowN = 0
      }
    }
    const k = 1 - Math.pow(camEase, dt)
    cam.pos.lerp(goal.pos, k); cam.look.lerp(goal.look, k)
    yaw += (gYaw - yaw) * k; pitch += (gPitch - pitch) * k
    fovK += (gFovK - fovK) * k
    shift += ((api.focused && api.panelOpen ? api.panelShiftGoal : 0) - shift) * k
    shiftY += ((api.focused && api.panelOpen ? api.panelShiftYGoal : 0) - shiftY) * k
    placeCamera()
    mascot.position.lerp(mGoal, 1 - Math.pow(0.03, dt))
    body.position.y = Math.sin(t * 2.2) * 0.025
    mascot.quaternion.copy(camera.quaternion)
    eyes.scale.y = (t % 4.2) > 4.05 ? 0.15 : 1
    eyes.position.x = MathUtils.clamp(mouse.x * 0.012, -0.012, 0.012)
    leds.forEach((l, i) => { l.visible = Math.sin(t * (3 + i) + i) > -0.3 })
    if ((frameN & 3) === 0) { for (let i = 0; i < bulbN; i++) bulbs.setColorAt(i, tmpC.copy(bulbBase[i]).multiplyScalar(0.7 + Math.sin(t * 1.6 + i * 0.7) * 0.3)); bulbs.instanceColor.needsUpdate = true }
    neonGlow.material.opacity = 0.9 + Math.sin(t * 7) * 0.05 + (Math.random() < 0.004 ? -0.5 : 0)
    steam.forEach((s, i) => { const p = ((t * 0.16 + i / steam.length) % 1); const fade = Math.sin(p * Math.PI) ** 2; s.position.set(-0.62 + Math.sin(p * 6 + i) * 0.012, 0.9 + p * 0.18, 0.28); s.material.opacity = fade * 0.5; s.scale.setScalar(0.03 + p * 0.07) })
    const dp = dustGeo.attributes.position
    for (let i = 0; i < dustN; i++) { dp.array[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0004; dp.array[i * 3] += Math.cos(t * 0.2 + i * 1.7) * 0.0003 }
    dp.needsUpdate = true
    // le disque tourne et le bras se pose quand la musique joue
    armK += ((music ? 1 : 0) - armK) * (1 - Math.pow(0.05, dt))
    arm.rotation.y = -0.05 + armK * 0.3
    // le feu : flammes qui dansent, lumière et halo qui vacillent
    const flick = 0.82 + Math.sin(t * 9.1) * 0.07 + Math.sin(t * 13.7 + 1.3) * 0.06 + Math.sin(t * 4.3) * 0.05
    fireL.intensity = 1.25 * flick; fireHalo.material.opacity = 0.75 * flick
    flames.forEach(f => { const u = f.userData, n = 0.75 + Math.sin(t * 7 + u.seed) * 0.15 + Math.sin(t * 11.3 + u.seed * 2) * 0.1; f.scale.set(0.12 * (0.9 + n * 0.15), u.h * n, 1); f.position.set(W - 0.12, 0.14 + u.h * n / 2, FZ + u.dz + Math.sin(t * 5 + u.seed) * 0.008) })
    // le chat cligne lentement des yeux
    const blink = (t % 6.5) > 6.2 ? 0.1 : 1
    catEyes.forEach(e => { e.scale.y += (blink - e.scale.y) * 0.4 })
    // la discothèque : le disque survolé dépasse, le disque choisi sort de sa case et vient face à nous
    crate.forEach((r, i) => {
      const goalP = selRec === i ? 1 : 0
      r.p += Math.sign(goalP - r.p) * Math.min(Math.abs(goalP - r.p), dt * 1.1)
      r.peek += ((hovRec === i && selRec !== i ? 1 : 0) - r.peek) * (1 - Math.pow(0.001, dt))
      const a = MathUtils.smootherstep(r.p, 0, 0.42), b = MathUtils.smootherstep(r.p, 0.35, 1)
      tmp.copy(r.base); tmp.x -= 0.4 * a + 0.045 * r.peek
      r.g.position.lerpVectors(tmp, present, b)
      r.g.rotation.set(Math.sin(b * Math.PI) * -0.12, presentYaw * b, 0)
      r.disc.position.x = MathUtils.smootherstep(r.p, 0.72, 1) * 0.16
      r.disc.rotation.z = -r.disc.position.x * 4
    })
    platter.rotation.y -= dt * armK * 3.5
    if ((frameN & 31) === 0) { const d = new Date(); minHand.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2; hourHand.rotation.z = -((d.getHours() % 12) / 12 + d.getMinutes() / 720) * Math.PI * 2 }
    phone.position.x = (Math.floor(t * 10) % 40 < 4) ? Math.sin(t * 90) * 0.003 : 0
    macGlow.material.color.setScalar(0.9 + Math.sin(t * 1.5) * 0.06)
    lampBulb.scale.setScalar(1 + Math.sin(t * 3) * 0.02)
    renderer.render(scene, camera)
    listeners.forEach(f => f())
    if (!frozen) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  const project = v => {
    tmp.copy(v).project(camera)
    return { x: (tmp.x * 0.5 + 0.5) * W2, y: (-tmp.y * 0.5 + 0.5) * H2 }
  }

  const api = {
    objects: Object.keys(objects),
    focused: null,
    panelOpen: false,
    panelShiftGoal: 0.18,
    panelShiftYGoal: 0,
    pick,
    hover(id) { if (hovered !== id) { hovered = id; paint() } },
    focus(id) {
      const v = objects[id].userData.view
      api.focused = focusedNow = id; paint()
      goal.pos.set(...v.pos); goal.look.set(...v.look)
      gYaw = 0; gPitch = 0; gFovK = 1
      // la mascotte se pose à gauche de l'objet, à sa hauteur, sans le masquer
      const a = objects[id].userData.anchor
      const toCam = tmp.copy(goal.pos).sub(a).normalize()
      const side = new Vector3().crossVectors(new Vector3(0, 1, 0), toCam).normalize()
      mGoal.copy(a).addScaledVector(side, -0.32).addScaledVector(toCam, 0.15).add(new Vector3(0, -0.05, 0))
    },
    unfocus() {
      api.focused = focusedNow = null; paint()
      goal.pos.copy(HOME.pos); goal.look.copy(HOME.look)
      mGoal.copy(homeMascot)
    },
    reset() { api.unfocus(); gYaw = 0; gPitch = 0; gFovK = 1 },
    // mode capture : caméra posée d'un coup, résolution fixe
    snap() { still = true; cam.pos.copy(goal.pos); cam.look.copy(goal.look); mascot.position.copy(mGoal) },
    rotate(dx, dy) { gYaw = MathUtils.clamp(gYaw + dx, -0.55, 0.55); gPitch = MathUtils.clamp(gPitch + dy, -0.2, 0.2) },
    anchorScreen(id) { return project(objects[id].userData.anchor) },
    mascotScreen() { return project(tmp.copy(mascot.position).add(new Vector3(0, 0.15 + body.position.y, 0))) },
    onFrame(f) { listeners.push(f) },
    setMusic(on) { music = on },
    // la discothèque
    pickRecord(x, y) {
      const r = canvas.getBoundingClientRect()
      ptr.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const hit = ray.intersectObjects(crate.filter(c => c.g.visible).map(c => c.sleeve), false)[0]
      return hit ? crate.findIndex(c => c.sleeve === hit.object) : -1
    },
    hoverRecord(i) { hovRec = i },
    selectRecord(i) { selRec = i; hovRec = -1; if (focusedNow === 'vinyls') mGoal.copy(i >= 0 ? present : vinyls.userData.anchor).add(tmp.set(0.05, i >= 0 ? 0.28 : 0.05, i >= 0 ? -0.32 : 0.3)) },
    recordScreen(i) { return project(tmp.copy(crate[i].g.position).add(new Vector3(0, 0.2, 0))) },
    // la pochette d'un disque (image de l'album) : sur la pochette, sur l'étiquette, et sur la platine s'il y est
    setRecordArt(i, url) {
      new TextureLoader().setCrossOrigin('anonymous').load(url, tex => {
        tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8
        arts[i] = tex
        const c = crate[i]
        c.front.map = tex; c.front.needsUpdate = true
        // la tranche prend la couleur de la pochette
        const avg = avgColor(tex.image)
        if (avg) {
          const css = `rgb(${avg.join(',')})`, light = avg[0] * 0.3 + avg[1] * 0.59 + avg[2] * 0.11 > 120
          const cv = c.spine.map.image; drawSpine(cv.getContext('2d'), cv.width, cv.height, RECORDS[i], css, light ? '#1d1b1a' : '#f6efe4'); c.spine.map.needsUpdate = true
          c.edge.color.set(css); c.back.color.set(css)
        }
        c.label.material.map = tex; c.label.material.color.set(0xffffff); c.label.material.needsUpdate = true
        if (i === onPlatter) api.setOnPlatter(i)
      })
    },
    // le disque posé sur la platine : sa case reste vide dans la discothèque
    setOnPlatter(i) {
      onPlatter = i
      crate.forEach((c, k) => { c.g.visible = k !== i })
      const tex = arts[i]
      ;[recordLabel, sleeveArt].forEach(m => { m.material.map = tex || null; m.material.color.set(tex ? 0xffffff : RECORDS[i].spine); m.material.needsUpdate = true })
    },
    // arrivée : la caméra part du fond de la pièce et glisse doucement jusqu'au bureau
    intro() { cam.pos.set(0, 1.75, 5.4); cam.look.set(0, 1.3, -1.0); camEase = 0.35; setTimeout(() => { camEase = 0.002 }, 2600) },
    // fige l'image (mode prise de vue)
    freeze() { frozen = true },
    hideMascot() { mascot.visible = false },
  }
  return api
}
