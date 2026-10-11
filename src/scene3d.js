// Index des projets en 3D : un clavier Three.js, une touche par projet.
// Chargé à la demande (import dynamique) quand la section approche de l'écran.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshToonMaterial, MeshBasicMaterial,
  PlaneGeometry, CanvasTexture, DataTexture, RedFormat, NearestFilter, HemisphereLight, DirectionalLight,
  ShadowMaterial, BackSide, Raycaster, Vector2, Vector3, SRGBColorSpace, PCFSoftShadowMap, Color,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { projects } from './projects.js'

const INK = 0x161616

// dégradé à 3 tons pour un rendu « cartoon » cohérent avec le reste du site
function toonRamp() {
  const t = new DataTexture(new Uint8Array([90, 180, 255]), 3, 1, RedFormat)
  t.minFilter = t.magFilter = NearestFilter
  t.needsUpdate = true
  return t
}

function labelTexture(p) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#161616'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '800 250px "Bricolage Grotesque", system-ui, sans-serif'
  g.fillText(p.letter, 256, 228)
  g.font = '600 46px "JetBrains Mono", ui-monospace, monospace'
  const name = p.name.length > 14 ? p.name.split(' ')[0] : p.name
  g.fillText(name.toUpperCase(), 256, 420)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default async function mountKeyboard3D(root, { sound, reduceMotion }) {
  await document.fonts?.ready
  const canvas = root.querySelector('canvas')
  const tip = root.querySelector('.k3-tip')
  const links = [...document.querySelectorAll('.k3-list a')]

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.1, 100)

  scene.add(new HemisphereLight(0xffffff, 0xcfc7b8, 1.6))
  const sun = new DirectionalLight(0xffffff, 2.2)
  sun.position.set(-4, 9, 5)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 5, bottom: -5 })
  sun.shadow.radius = 6
  scene.add(sun)

  const ground = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.16 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.62
  ground.receiveShadow = true
  scene.add(ground)

  const ramp = toonRamp()
  const board = new Group()
  scene.add(board)

  // le boîtier du clavier
  const caseGeo = new RoundedBoxGeometry(6.9, 0.5, 3.4, 4, 0.24)
  const plate = new Mesh(caseGeo, new MeshToonMaterial({ color: 0xfffdf8, gradientMap: ramp }))
  plate.position.y = -0.35
  plate.receiveShadow = true
  plate.castShadow = true
  const plateOutline = new Mesh(caseGeo, new MeshBasicMaterial({ color: INK, side: BackSide }))
  plateOutline.scale.setScalar(1.025)
  plate.add(plateOutline)
  board.add(plate)
  // le boîtier suit le thème clair / sombre
  const plateColor = () => plate.material.color.set(document.documentElement.classList.contains('dark') ? 0x2a2824 : 0xfffdf8)
  plateColor()
  addEventListener('themechange', plateColor)

  // les touches
  const baseGeo = new RoundedBoxGeometry(1.18, 0.62, 1.18, 4, 0.16)
  const topGeo = new RoundedBoxGeometry(0.92, 0.2, 0.86, 4, 0.12)
  const labelGeo = new PlaneGeometry(0.86, 0.86)
  const keys = projects.map((p, i) => {
    const row = i < 4 ? 0 : 1
    const col = i % 4
    const k = new Group()
    k.position.set((col - 1.5) * 1.58 + (row ? 0.3 : -0.15), 0.12, (row - 0.5) * 1.55)
    const base = new Mesh(baseGeo, new MeshToonMaterial({ color: new Color(p.deep), gradientMap: ramp }))
    base.castShadow = true
    const outline = new Mesh(baseGeo, new MeshBasicMaterial({ color: INK, side: BackSide }))
    outline.scale.set(1.06, 1.08, 1.06)
    const top = new Mesh(topGeo, new MeshToonMaterial({ color: new Color(p.color), gradientMap: ramp }))
    top.position.set(0, 0.36, -0.06)
    const topOutline = new Mesh(topGeo, new MeshBasicMaterial({ color: INK, side: BackSide }))
    topOutline.scale.set(1.05, 1.25, 1.06)
    top.add(topOutline)
    const label = new Mesh(labelGeo, new MeshBasicMaterial({ map: labelTexture(p), transparent: true }))
    label.rotation.x = -Math.PI / 2
    label.position.set(0, 0.461, -0.06)
    k.add(base, outline, top, label)
    k.userData = { p, i, baseY: k.position.y, lift: 0, press: 0, phase: i * 0.7 }
    board.add(k)
    base.userData.key = top.userData.key = label.userData.key = k
    return k
  })

  /* ---------- interaction ---------- */
  const ray = new Raycaster()
  const ptr = new Vector2(-9, -9)
  let hovered = null, dragging = false, dragX = 0, yaw = 0, yawVel = 0, tiltX = 0, tiltY = 0, mx = 0, my = 0
  const pickables = keys.flatMap(k => k.children.filter(c => c.userData.key))

  function setHover(k, fromList = false) {
    if (hovered === k) return
    hovered = k
    canvas.style.cursor = k ? 'pointer' : dragging ? 'grabbing' : 'grab'
    links.forEach((a, i) => a.classList.toggle('on', !!k && k.userData.i === i))
    if (k) {
      sound.click(1.25)
      tip.innerHTML = `<b>${k.userData.p.name}</b><span>${k.userData.p.kicker}</span>`
      tip.style.setProperty('--c', k.userData.p.color)
    }
    tip.classList.toggle('show', !!k && !fromList)
  }

  function pointer(e) {
    const r = canvas.getBoundingClientRect()
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    mx = ptr.x; my = ptr.y
  }
  canvas.addEventListener('pointermove', e => {
    pointer(e)
    if (dragging) {
      const dx = e.clientX - dragX
      dragX = e.clientX
      yawVel = dx * 0.006
      yaw += yawVel
      return
    }
    ray.setFromCamera(ptr, camera)
    const hit = ray.intersectObjects(pickables, false)[0]
    setHover(hit ? hit.object.userData.key : null)
  })
  canvas.addEventListener('pointerleave', () => { ptr.set(-9, -9); mx = my = 0; setHover(null) })
  let downAt = 0, downX = 0
  canvas.addEventListener('pointerdown', e => {
    pointer(e)
    downAt = performance.now(); downX = e.clientX
    ray.setFromCamera(ptr, camera)
    const hit = ray.intersectObjects(pickables, false)[0]
    if (hit) { hit.object.userData.key.userData.press = 1; sound.click(0.85); return }
    dragging = true; dragX = e.clientX
    canvas.setPointerCapture(e.pointerId)
    canvas.style.cursor = 'grabbing'
  })
  canvas.addEventListener('pointerup', e => {
    if (dragging) { dragging = false; canvas.style.cursor = 'grab'; return }
    pointer(e)
    ray.setFromCamera(ptr, camera)
    const hit = ray.intersectObjects(pickables, false)[0]
    const isTap = performance.now() - downAt < 600 && Math.abs(e.clientX - downX) < 10
    if (hit && isTap) {
      const k = hit.object.userData.key
      setTimeout(() => { location.href = `/projets/${k.userData.p.slug}/` }, 200)
    }
  })
  links.forEach((a, i) => {
    a.addEventListener('pointerenter', () => setHover(keys[i], true))
    a.addEventListener('focus', () => setHover(keys[i], true))
    a.addEventListener('pointerleave', () => setHover(null))
    a.addEventListener('blur', () => setHover(null))
    a.addEventListener('click', () => { keys[i].userData.press = 1; sound.click(0.85) })
  })

  /* ---------- boucle ---------- */
  function resize() {
    const w = root.clientWidth, h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // sur écran étroit on recule la caméra pour que tout le clavier tienne
    const fit = Math.max(1, 1.6 / camera.aspect)
    camera.position.set(0, 6.6 * fit, 8.2 * fit)
    camera.lookAt(0, 0.05, 0.75)
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(root)
  resize()

  let visible = false, last = performance.now(), t = 0
  const tmp = new Vector3()
  function frame(now) {
    if (!visible) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    t += dt
    if (!dragging) { yawVel *= 0.94; yaw += yawVel; if (!reduceMotion) yaw += (0 - yaw) * 0.015 }
    tiltX += ((reduceMotion ? 0 : my * 0.12) - tiltX) * 0.06
    tiltY += ((reduceMotion ? 0 : mx * 0.18) - tiltY) * 0.06
    board.rotation.set(-tiltX, yaw + tiltY, 0)
    for (const k of keys) {
      const d = k.userData
      d.lift += ((hovered === k ? 1 : 0) - d.lift) * 0.18
      d.press = Math.max(0, d.press - dt * 3)
      const bob = reduceMotion ? 0 : Math.sin(t * 1.6 + d.phase) * 0.045
      k.position.y = d.baseY + bob + d.lift * 0.32 - d.press * 0.3
      k.rotation.z = reduceMotion ? 0 : Math.sin(t * 1.1 + d.phase) * 0.02 + d.lift * 0.05
      k.scale.setScalar(1 + d.lift * 0.06)
    }
    if (hovered && tip.classList.contains('show')) {
      hovered.getWorldPosition(tmp)
      tmp.y += 0.9
      tmp.project(camera)
      tip.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * canvas.clientWidth}px, ${(-tmp.y * 0.5 + 0.5) * canvas.clientHeight}px) translate(-50%, -100%)`
    }
    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }
  new IntersectionObserver(([en]) => {
    const was = visible
    visible = en.isIntersecting && !document.hidden
    if (visible && !was) { last = performance.now(); requestAnimationFrame(frame) }
  }, { threshold: 0.05 }).observe(root)
  root.classList.add('ready')
}
