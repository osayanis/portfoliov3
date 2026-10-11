// Le bureau de Yanis en 3D (Three.js). On se tient dans la pièce, face au grand bureau
// en bois, avec la baie vitrée derrière. Chaque objet interactif est un chapitre.
// Ce module ne gère que la 3D ; l'interface est dans main.js.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial,
  CylinderGeometry, SphereGeometry, ConeGeometry, PlaneGeometry, TorusGeometry, BufferGeometry, Float32BufferAttribute,
  Points, PointsMaterial, InstancedMesh, Object3D, BoxGeometry, Sprite, SpriteMaterial, CanvasTexture, SRGBColorSpace, RepeatWrapping, TextureLoader,
  HemisphereLight, DirectionalLight, PointLight, SpotLight, AdditiveBlending,
  Raycaster, Vector2, Vector3, Color, PCFSoftShadowMap, ACESFilmicToneMapping, PMREMGenerator, DoubleSide, MathUtils,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

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
function skyTex(day) {
  return canvasTex(2048, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h)
    if (day) { sky.addColorStop(0, '#5b4b8a'); sky.addColorStop(0.45, '#e98c7a'); sky.addColorStop(0.75, '#ffc27a'); sky.addColorStop(1, '#ffe2a8') }
    else { sky.addColorStop(0, '#070818'); sky.addColorStop(0.55, '#1a1846'); sky.addColorStop(0.85, '#3d2a5e'); sky.addColorStop(1, '#6b3b4e') }
    g.fillStyle = sky; g.fillRect(0, 0, w, h)
    if (day) {
      const sun = g.createRadialGradient(w * 0.62, h * 0.7, 10, w * 0.62, h * 0.7, 260)
      sun.addColorStop(0, '#fff6d8'); sun.addColorStop(0.15, '#ffd27a'); sun.addColorStop(1, 'rgba(255,180,120,0)')
      g.fillStyle = sun; g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(255,240,220,.35)'
      ;[[300, 260, 160], [1300, 200, 220], [1700, 330, 140]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.22, 0, 0, 7); g.fill() })
    } else {
      for (let i = 0; i < 380; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.8})`; const s = rnd() < 0.08 ? 3 : 1.6; g.fillRect(rnd() * w, rnd() * h * 0.62, s, s) }
      const m = g.createRadialGradient(w * 0.72, h * 0.22, 4, w * 0.72, h * 0.22, 140)
      m.addColorStop(0, 'rgba(255,248,225,.55)'); m.addColorStop(1, 'rgba(255,248,225,0)')
      g.fillStyle = m; g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(w * 0.72, h * 0.22, 46, 0, 7); g.fill()
    }
    // deux rangées d'immeubles pour la profondeur
    ;[[0.56, day ? '#6b4a6e' : '#1b1736', 0.5], [0.66, day ? '#4a3354' : '#100e24', 1]].forEach(([top, col, k]) => {
      for (let x = -20; x < w; x += 40 + rnd() * 70) {
        const bw = 50 + rnd() * 90, bh = h * (1 - top) * (0.4 + rnd() * 0.6) * (k === 1 ? 1.3 : 1)
        g.fillStyle = col; g.fillRect(x, h - bh, bw, bh)
        for (let y = h - bh + 12; y < h - 8; y += 18) for (let wx = x + 8; wx < x + bw - 8; wx += 14) {
          if (rnd() < (day ? 0.08 : 0.32)) { g.fillStyle = rnd() < 0.7 ? '#ffcf7a' : '#ff9b6b'; g.fillRect(wx, y, 6, 9) }
        }
      }
    })
  })
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
const rugTex = () => canvasTex(1024, 700, (g, w, h) => {
  g.fillStyle = '#b4532a'; g.fillRect(0, 0, w, h)
  g.strokeStyle = '#f2c38b'; g.lineWidth = 14; g.strokeRect(40, 40, w - 80, h - 80)
  g.strokeStyle = '#7a2e1a'; g.lineWidth = 8; g.strokeRect(80, 80, w - 160, h - 160)
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    const x = 170 + i * 137, y = 170 + j * 120
    g.fillStyle = (i + j) % 2 ? '#f2c38b' : '#e8875a'
    g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 34, y); g.lineTo(x, y + 34); g.lineTo(x - 34, y); g.fill()
  }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.06})`; g.fillRect(rnd() * w, rnd() * h, 2, 2) }
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
export async function createRoom(canvas, { snapshot, avatar, noAO = false }) {
  await document.fonts?.ready
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  // résolution plafonnée (1,5 au lieu de 2 sur les écrans Retina) : la différence se voit à peine, le gain est énorme
  let dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5)
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
  scene.add(hemi, sky, sky.target, deskLamp, deskLamp.target, floorLampL, pendantL)
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
  quad(world, W * 2, D1 - D0, mat(0xd9c2a3, { rough: 1 }), [0, H, (D0 + D1) / 2], [Math.PI / 2, 0, 0], { cast: false })
  // poutres et plinthes
  const beamMat = mat(0xffffff, { map: woodTex('#7a4f2e', '40,20,10'), rough: 0.7 })
  for (let z = -2.2; z < D1; z += 1.8) box(world, W * 2, 0.16, 0.2, beamMat, [0, H - 0.08, z], null, { cast: false })
  ;[-W + 0.01, W - 0.01].forEach(x => box(world, 0.03, 0.1, D1 - D0, 0xc79f78, [x, 0.05, (D0 + D1) / 2]))

  // la baie vitrée : un mur presque entièrement vitré
  const skyNight = skyTex(false), skyDay = skyTex(true)
  const outside = quad(world, 24, 11, glow(0xffffff, { map: skyNight }), [0, 3.4, -10], null, { receive: false })
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
  const deskWood = mat(0xffffff, { map: woodTex('#a8703f', '70,36,14'), rough: 0.55 })
  box(world, 2.0, 0.06, 0.95, deskWood, [0, 0.76, 0], null, { r: 0.02 })
  ;[-0.85, 0.85].forEach(x => {
    box(world, 0.07, 0.73, 0.07, deskWood, [x, 0.365, -0.38])
    box(world, 0.07, 0.73, 0.07, deskWood, [x, 0.365, 0.38])
    box(world, 0.07, 0.07, 0.76, deskWood, [x, 0.12, 0])
  })
  box(world, 0.55, 0.32, 0.85, deskWood, [0.6, 0.55, 0], null, { r: 0.02 })
  ;[0.62, 0.46].forEach(y => box(world, 0.16, 0.02, 0.02, mat(0xd8b46a, { metal: 0.8, rough: 0.3 }), [0.6, y, 0.43]))

  // le fauteuil, derrière le bureau
  const leather = mat(0x6b3a22, { rough: 0.55 })
  box(world, 0.62, 0.12, 0.58, leather, [0, 0.5, -0.82], null, { r: 0.05 })
  box(world, 0.62, 0.78, 0.12, leather, [0, 0.98, -1.1], [-0.12, 0, 0], { r: 0.06 })
  ;[-0.33, 0.33].forEach(x => box(world, 0.08, 0.22, 0.5, leather, [x, 0.66, -0.85], null, { r: 0.03 }))
  cyl(world, 0.035, 0.035, 0.4, mat(0x2b2b2b, { metal: 0.7, rough: 0.3 }), [0, 0.25, -0.82])
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; box(world, 0.32, 0.03, 0.05, mat(0x2b2b2b, { metal: 0.7, rough: 0.3 }), [Math.cos(a) * 0.16, 0.05, -0.82 + Math.sin(a) * 0.16], [0, -a, 0]) }

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
  for (let i = 0; i < 7; i++) { const sp = new Sprite(new SpriteMaterial({ map: puff, transparent: true, opacity: 0.15, depthWrite: false })); sp.scale.setScalar(0.05); world.add(sp); steam.push(sp) }
  cyl(world, 0.05, 0.04, 0.08, mat(0xd97757), [-0.85, 0.83, -0.3])
  for (let k = 0; k < 5; k++) mesh(world, new ConeGeometry(0.025, 0.16, 6), mat(0x4caf6a), [-0.85 + (rnd() - 0.5) * 0.06, 0.92, -0.3 + (rnd() - 0.5) * 0.06], [(rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6])

  /* ===== objets interactifs sur le bureau ===== */
  // MacBook, écran tourné vers nous
  const macbook = obj('macbook', [-0.1, 1.12, -0.15], { pos: [-0.1, 1.18, 1.05], look: [-0.1, 0.92, -0.15] })
  const alu = mat(0xc9ccd4, { metal: 0.6, rough: 0.35 })
  box(macbook, 0.46, 0.015, 0.32, alu, [-0.1, 0.795, -0.05], null, { r: 0.008 })
  const lid = new Group(); lid.position.set(-0.1, 0.8, -0.21); lid.rotation.x = -0.22; macbook.add(lid)
  box(lid, 0.46, 0.31, 0.012, alu, [0, 0.155, 0], null, { r: 0.008 })
  const macGlow = quad(lid, 0.43, 0.28, glow(0xffffff, { map: macScreen() }), [0, 0.155, 0.008])

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

  const openpod = obj('openpod', [BX + 0.25, 0.98, -2.35], { pos: [-1.4, 1.0, -1.9], look: [BX, 0.74, -2.35] })
  box(openpod, 0.05, 0.2, 0.12, mat(0xf4f4f5, { rough: 0.4 }), [BX + 0.05, 0.72, -2.35], [0, 0, 0.18], { r: 0.015 })
  quad(openpod, 0.085, 0.07, glow(0xffffff, { map: podScreen() }), [BX + 0.087, 0.77, -2.35], [0, Math.PI / 2, 0.18])
  cyl(openpod, 0.03, 0.03, 0.006, mat(0xd4d4d8), [BX + 0.075, 0.68, -2.35], [0, 0, Math.PI / 2 + 0.18])

  const calendar = obj('calendar', [-W + 0.15, 2.05, -1.0], { pos: [-1.0, 1.6, -0.6], look: [-W, 1.6, -1.0] })
  box(calendar, 0.02, 0.62, 0.52, mat(0xfffdf8), [-W + 0.012, 1.6, -1.0])
  quad(calendar, 0.5, 0.6, mat(0xffffff, { map: calTex(snapshot?.contributions || []), rough: 0.9 }), [-W + 0.025, 1.6, -1.0], [0, Math.PI / 2, 0])


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

  const turntable = obj('turntable', [TX + 0.1, 1.05, -0.62], { pos: [-1.35, 1.2, -0.25], look: [TX, 0.72, -0.62] })
  box(turntable, 0.4, 0.07, 0.34, mat(0xffffff, { map: woodTex('#a8703f', '70,36,14'), rough: 0.45 }), [TX, 0.705, -0.62], null, { r: 0.012 })
  box(turntable, 0.39, 0.012, 0.33, new MeshStandardMaterial({ color: 0x99a, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.4 }), [TX, 0.83, -0.62], null, { r: 0.01, cast: false })
  const platter = new Group(); platter.position.set(TX - 0.03, 0.745, -0.64); turntable.add(platter)
  cyl(platter, 0.14, 0.14, 0.012, mat(0x2b2b2b, { metal: 0.6, rough: 0.35 }), [0, 0, 0], null, { seg: 48 })
  cyl(platter, 0.13, 0.13, 0.004, mat(0x111111, { rough: 0.25 }), [0, 0.008, 0], null, { seg: 48 })
  for (let r = 0.06; r < 0.13; r += 0.012) mesh(platter, new TorusGeometry(r, 0.0006, 4, 48), mat(0x2e2e2e, { rough: 0.2 }), [0, 0.0105, 0], [Math.PI / 2, 0, 0], { cast: false })
  cyl(platter, 0.045, 0.045, 0.005, mat(0xd4573a, { rough: 0.7 }), [0, 0.011, 0], null, { seg: 32 })
  ball(platter, 0.006, mat(0xd8d8d8, { metal: 0.9, rough: 0.2 }), [0, 0.016, 0], { cast: false })
  const arm = new Group(); arm.position.set(TX + 0.12, 0.765, -0.5); turntable.add(arm)
  cyl(arm, 0.018, 0.018, 0.03, mat(0xc0c0c0, { metal: 0.9, rough: 0.25 }), [0, 0, 0])
  box(arm, 0.008, 0.008, 0.2, mat(0xc8c8c8, { metal: 0.9, rough: 0.25 }), [0, 0.02, -0.1], null, { r: 0.003 })
  box(arm, 0.02, 0.012, 0.03, mat(0x222222), [0, 0.016, -0.2], null, { r: 0.003 })
  arm.rotation.y = 0.55
  // une pochette posée contre le meuble
  box(turntable, 0.3, 0.3, 0.01, mat(0x1d1d22, { rough: 0.7 }), [TX + 0.16, 0.18, -0.2], [0, Math.PI / 2 - 0.15, -0.12], { r: 0.003 })
  quad(turntable, 0.24, 0.24, mat(0xffffff, { map: canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b1a14'); gr.addColorStop(1, '#8a5a36'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f2ead9'; g.font = '700 46px "Instrument Serif", serif'; g.textAlign = 'center'; g.fillText('Soul', w / 2, h * 0.6); g.font = '600 18px "JetBrains Mono", monospace'; g.fillText('SEAL', w / 2, h * 0.75) }), bump: false }), [TX + 0.168, 0.18, -0.2], [0, Math.PI / 2 - 0.15, -0.12])

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

  /* ===== mur de droite : piano, néon, cadre, serveur, fauteuil ===== */
  const piano = obj('piano', [W - 0.5, 1.15, -1.75], { pos: [1.1, 1.5, -1.0], look: [W - 0.45, 0.85, -1.75] })
  box(piano, 0.32, 0.08, 1.2, mat(0x1c1c1f, { rough: 0.4 }), [W - 0.45, 0.85, -1.75], null, { r: 0.015 })
  box(piano, 0.13, 0.02, 1.12, mat(0xfafafa, { rough: 0.5 }), [W - 0.56, 0.9, -1.75], null, { r: 0.004 })
  for (let o = 0; o < 3; o++) [0, 1, 3, 4, 5].forEach(b => box(piano, 0.07, 0.022, 0.035, mat(0x111111), [W - 0.53, 0.915, -2.29 + (o * 7 + b) * 0.051 + 0.026], null, { r: 0.003 }))
  ;[-2.2, -1.3].forEach(z => {
    box(piano, 0.03, 0.85, 0.03, mat(0x2b2b2b, { metal: 0.6, rough: 0.4 }), [W - 0.45, 0.42, z], [0.35, 0, 0])
    box(piano, 0.03, 0.85, 0.03, mat(0x2b2b2b, { metal: 0.6, rough: 0.4 }), [W - 0.45, 0.42, z], [-0.35, 0, 0])
  })

  const neon = obj('neon', [W - 0.2, 2.35, -1.75], { pos: [1.0, 2.0, -0.9], look: [W, 2.0, -1.75] })
  box(neon, 0.04, 0.42, 1.25, mat(0x1a1424, { rough: 0.5 }), [W - 0.02, 2.0, -1.75], null, { r: 0.04 })
  const neonGlow = quad(neon, 1.35, 0.4, glow(0xffffff, { map: neonTex(), transparent: true }), [W - 0.05, 2.0, -1.75], [0, -Math.PI / 2, 0])

  const frameObj = obj('frame', [W - 0.15, 2.0, -0.85], { pos: [1.1, 1.6, -0.4], look: [W, 1.6, -0.85] })
  box(frameObj, 0.04, 0.6, 0.48, mat(0xd8b46a, { metal: 0.5, rough: 0.4 }), [W - 0.02, 1.6, -0.85], null, { r: 0.01 })
  const photoMat = mat(0xf9a8a8, { rough: 0.6 })
  const photo = quad(frameObj, 0.4, 0.5, photoMat, [W - 0.045, 1.6, -0.85], [0, -Math.PI / 2, 0])
  // la matière est clonée plus bas (surbrillance au survol) : on vise celle du mesh
  if (avatar) new TextureLoader().setCrossOrigin('anonymous').load(avatar, t => { t.colorSpace = SRGBColorSpace; photo.material.map = t; photo.material.color.set(0xffffff); photo.material.needsUpdate = true })

  /* ===== mur de droite : étagère, affiche, horloge, guitare, plante suspendue ===== */
  const RW = W - 0.01
  // étagère murale au-dessus du piano
  box(world, 0.22, 0.03, 1.15, shelfWood, [RW - 0.11, 1.38, -1.75], null, { r: 0.006 })
  ;[-2.25, -1.25].forEach(z => box(world, 0.16, 0.12, 0.02, brass, [RW - 0.08, 1.31, z]))
  const shelfBooks = []
  for (let z = -2.28; z < -1.92;) { const t = 0.03 + rnd() * 0.03, h = 0.18 + rnd() * 0.08; shelfBooks.push([RW - 0.1, 1.395, z, t, h]); z += t + 0.004 }
  addBooks(world, shelfBooks, bookCols)
  box(world, 0.12, 0.17, 0.12, mat(0x2a2a2e, { rough: 0.6 }), [RW - 0.1, 1.48, -1.72], null, { r: 0.015 })
  cyl(world, 0.035, 0.035, 0.005, mat(0x555555, { metal: 0.6, rough: 0.4 }), [RW - 0.162, 1.5, -1.72], [0, 0, Math.PI / 2])
  cyl(world, 0.045, 0.035, 0.07, mat(0xd97757), [RW - 0.1, 1.43, -1.45])
  const shelfLeaf = new MeshStandardMaterial({ map: leafTex('#3b7d50', '#62b07a'), alphaTest: 0.5, side: DoubleSide, roughness: 0.6 })
  for (let k = 0; k < 6; k++) { const a = rnd() * 6.28; const l = mesh(world, new PlaneGeometry(0.06, 0.14), shelfLeaf, [RW - 0.1 + Math.cos(a) * 0.04, 1.52, -1.45 + Math.sin(a) * 0.04], null); l.rotation.set(-0.9, -a + Math.PI / 2, 0, 'YXZ') }
  box(world, 0.01, 0.2, 0.2, mat(0x111111, { rough: 0.3 }), [RW - 0.14, 1.5, -1.25], [0, 0, -0.1], { r: 0.003 })

  // affiche encadrée (coucher de soleil sur la mer), près de la baie
  box(world, 0.03, 0.62, 0.46, mat(0x2a1b13, { rough: 0.5 }), [RW - 0.015, 2.3, -2.62], null, { r: 0.008 })
  quad(world, 0.4, 0.56, mat(0xffffff, { map: canvasTex(320, 448, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.62); sky.addColorStop(0, '#f2c38b'); sky.addColorStop(1, '#e8875a')
    g.fillStyle = '#f3ead9'; g.fillRect(0, 0, w, h)
    g.fillStyle = sky; g.fillRect(24, 24, w - 48, h * 0.62)
    g.fillStyle = '#d4573a'; g.beginPath(); g.arc(w / 2, h * 0.5, 54, Math.PI, 0); g.fill()
    g.fillStyle = '#2f4f6a'; g.fillRect(24, h * 0.5, w - 48, h * 0.62 - h * 0.5 + 24)
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(242,195,139,.5)'; g.fillRect(w / 2 - 50 + k * 4, h * 0.53 + k * 9, 100 - k * 8, 3) }
    g.fillStyle = '#2a1b13'; g.font = '600 26px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText('MARSEILLE · 2026', w / 2, h - 40)
  }), bump: false, rough: 0.8 }), [RW - 0.032, 2.3, -2.62], [0, -Math.PI / 2, 0])

  // horloge au-dessus du cadre
  const clock = new Group(); clock.position.set(RW - 0.03, 2.38, -0.85); clock.rotation.y = -Math.PI / 2; world.add(clock)
  cyl(clock, 0.16, 0.16, 0.04, mat(0x2a1b13, { rough: 0.5 }), [0, 0, 0], [Math.PI / 2, 0, 0], { seg: 32 })
  cyl(clock, 0.14, 0.14, 0.045, mat(0xf3ead9, { rough: 0.8 }), [0, 0, 0.002], [Math.PI / 2, 0, 0], { seg: 32 })
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; box(clock, 0.006, k % 3 ? 0.012 : 0.024, 0.004, mat(0x2a1b13), [Math.sin(a) * 0.12, Math.cos(a) * 0.12, 0.026], [0, 0, -a], { cast: false }) }
  const hourHand = box(clock, 0.008, 0.07, 0.004, mat(0x2a1b13), [0, 0, 0.03], null, { cast: false })
  const minHand = box(clock, 0.005, 0.1, 0.004, mat(0xb4532a), [0, 0, 0.032], null, { cast: false })
  hourHand.geometry.translate(0, 0.03, 0); minHand.geometry.translate(0, 0.045, 0)

  // guitare posée contre le mur
  const guitar = new Group(); guitar.position.set(RW - 0.16, 0, -0.42); guitar.rotation.set(0, -Math.PI / 2, 0.16); world.add(guitar)
  const guitarWood = mat(0xffffff, { map: woodTex('#c98a4a', '90,45,15'), rough: 0.35 })
  const lower = ball(guitar, 0.19, guitarWood, [0, 0.26, 0]); lower.scale.set(1, 1.05, 0.38)
  const upper = ball(guitar, 0.145, guitarWood, [0, 0.52, 0]); upper.scale.set(1, 1.0, 0.38)
  cyl(guitar, 0.055, 0.055, 0.01, mat(0x1a120d), [0, 0.47, 0.06], [Math.PI / 2, 0, 0], { cast: false })
  box(guitar, 0.05, 0.5, 0.025, mat(0x3a2418, { rough: 0.5 }), [0, 0.88, 0.02], null, { r: 0.006 })
  box(guitar, 0.08, 0.14, 0.025, mat(0x2a1b13), [0, 1.18, 0.01], null, { r: 0.01 })
  box(guitar, 0.08, 0.015, 0.02, mat(0x1a120d), [0, 0.28, 0.072], null, { r: 0.003 })

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
  const homeMascot = new Vector3(-0.35, 1.0, 0.05)
  mascot.position.copy(homeMascot)
  scene.add(mascot)

  /* ---------- rendu avec halo (bloom) ---------- */
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.3, 0.4, 0.96)
  composer.addPass(bloom)
  const vignette = new ShaderPass(VignetteShader)
  vignette.uniforms.offset.value = 0.95
  vignette.uniforms.darkness.value = 1.15
  composer.addPass(vignette)
  composer.addPass(new OutputPass())

  /* ---------- jour (coucher de soleil) / nuit ---------- */
  function setDay(day) {
    outside.material.map = day ? skyDay : skyNight; outside.material.needsUpdate = true
    sky.color.set(day ? 0xffa060 : 0x9db4ff); sky.intensity = day ? 1.7 : 1.1
    sky.position.set(day ? 2.5 : -2.5, day ? 2.2 : 4.5, -8)
    hemi.intensity = day ? 0.9 : 0.35
    deskLamp.intensity = day ? 1.6 : 2.8
    floorLampL.intensity = day ? 0.5 : 1.3
    pendantL.intensity = day ? 0.4 : 1.1
    renderer.toneMappingExposure = day ? 0.92 : 0.95
    scene.environmentIntensity = day ? 0.3 : 0.12
    bloom.strength = day ? 0.18 : 0.3
    renderer.shadowMap.needsUpdate = true
  }

  /* ---------- caméra ---------- */
  const HOME = { pos: new Vector3(0, 1.5, 3.2), look: new Vector3(0, 1.1, -1.0) }
  const cam = { pos: HOME.pos.clone(), look: HOME.look.clone() }
  const goal = { pos: HOME.pos.clone(), look: HOME.look.clone() }
  let focusedNow = null
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
    composer.setSize(W2, H2)
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
    lookV.applyAxisAngle(new Vector3(0, 1, 0), yaw + (api.focused ? 0 : -mouse.x * 0.05))
    lookV.y += (pitch + (api.focused ? 0 : mouse.y * 0.04)) * lookV.length()
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
    if (frameN > 30 && raw < 0.5) {
      slowAcc += raw; slowN++
      if (slowN === 60) {
        if (slowAcc / slowN > 1 / 45) {
          if (dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize() }
          else if (bloom.enabled) bloom.enabled = false
        }
        slowAcc = 0; slowN = 0
      }
    }
    const k = 1 - Math.pow(0.002, dt)
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
    steam.forEach((s, i) => { const p = ((t * 0.25 + i / steam.length) % 1); s.position.set(-0.62 + Math.sin(p * 9 + i) * 0.015, 0.9 + p * 0.22, 0.28); s.material.opacity = Math.sin(p * Math.PI) * 0.14; s.scale.setScalar(0.04 + p * 0.09) })
    const dp = dustGeo.attributes.position
    for (let i = 0; i < dustN; i++) { dp.array[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0004; dp.array[i * 3] += Math.cos(t * 0.2 + i * 1.7) * 0.0003 }
    dp.needsUpdate = true
    // le disque tourne et le bras se pose quand la musique joue
    armK += ((music ? 1 : 0) - armK) * (1 - Math.pow(0.05, dt))
    arm.rotation.y = 0.55 - armK * 0.42
    platter.rotation.y -= dt * armK * 3.5
    if ((frameN & 31) === 0) { const d = new Date(); minHand.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2; hourHand.rotation.z = -((d.getHours() % 12) / 12 + d.getMinutes() / 720) * Math.PI * 2 }
    phone.position.x = (Math.floor(t * 10) % 40 < 4) ? Math.sin(t * 90) * 0.003 : 0
    macGlow.material.color.setScalar(0.9 + Math.sin(t * 1.5) * 0.06)
    lampBulb.scale.setScalar(1 + Math.sin(t * 3) * 0.02)
    composer.render()
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
    setDay,
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
    rotate(dx, dy) { gYaw = MathUtils.clamp(gYaw + dx, -0.55, 0.55); gPitch = MathUtils.clamp(gPitch + dy, -0.2, 0.2) },
    zoomBy(f) { gFovK = MathUtils.clamp(gFovK * f, 0.8, 1.8) },
    anchorScreen(id) { return project(objects[id].userData.anchor) },
    mascotScreen() { return project(tmp.copy(mascot.position).add(new Vector3(0, 0.15 + body.position.y, 0))) },
    onFrame(f) { listeners.push(f) },
    setMusic(on) { music = on },
    // fige l'image (mode prise de vue)
    freeze() { frozen = true },
    hideMascot() { mascot.visible = false },
  }
  return api
}
