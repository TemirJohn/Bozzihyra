import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/*
  Мультяшное золото: toon-шейдинг (3 ступени света), тёмный контур, блик-полоска и искорки.
  model: 'coin' — монета, 'stack' — стопка монет (count штук), 'nugget' — самородок.
  live=false — статичный снимок, кешируется по модели.
*/

const INK = 0x5b3a07       // цвет контура
const GOLD = '#ffc83d'
const GOLD_EDGE = '#f0a925'

let gradient = null
function toonGradient() {
  if (gradient) return gradient
  gradient = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat)
  gradient.minFilter = THREE.NearestFilter
  gradient.magFilter = THREE.NearestFilter
  gradient.generateMipmaps = false
  gradient.needsUpdate = true
  return gradient
}

const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: toonGradient(), ...opts })

// Контур «перевёрнутой оболочкой»: увеличенная копия, у которой видны только задние грани
function outlined(geo, material, thickness = 1.07) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(geo, material)
  const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }))
  hull.scale.setScalar(thickness)
  group.add(hull, body)
  return group
}

function faceTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = GOLD; g.fillRect(0, 0, 512, 512)
  // Внутреннее кольцо
  g.lineWidth = 26; g.strokeStyle = GOLD_EDGE
  g.beginPath(); g.arc(256, 256, 196, 0, Math.PI * 2); g.stroke()
  // Звезда с «тиснением»: читается при любом повороте монеты
  const star = (cx, cy, color) => {
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 58 : 132
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    g.closePath(); g.fillStyle = color; g.fill()
  }
  star(262, 270, '#fff1b8')
  star(256, 262, '#e39a14')
  // Мультяшный блик
  g.save(); g.translate(170, 150); g.rotate(-0.7)
  g.fillStyle = 'rgba(255,255,255,.75)'
  g.beginPath(); g.roundRect(-70, -16, 140, 32, 16); g.fill()
  g.beginPath(); g.roundRect(-30, 30, 60, 18, 9); g.fill()
  g.restore()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function coinMesh(face) {
  const geo = new THREE.CylinderGeometry(1, 1, 0.22, 48)
  const edge = toon({ color: GOLD_EDGE })
  const top = toon({ map: face })
  // Группы цилиндра: 0 — бок, 1 — верх, 2 — низ
  const body = new THREE.Mesh(geo, [edge, top, top])
  const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }))
  hull.scale.set(1.06, 1.25, 1.06)
  const g = new THREE.Group()
  g.add(hull, body)
  return g
}

function buildModel(model, count) {
  const face = faceTexture()
  const root = new THREE.Group()
  if (model === 'coin') {
    const coin = coinMesh(face)
    coin.rotation.x = Math.PI / 2 // монета стоит «лицом» к камере
    root.add(coin)
  } else if (model === 'stack') {
    const n = Math.max(1, Math.min(8, count))
    for (let i = 0; i < n; i++) {
      const coin = coinMesh(face)
      coin.scale.setScalar(0.82)
      coin.position.set(Math.sin(i * 2.1) * 0.06, -0.75 + i * 0.22, Math.cos(i * 1.7) * 0.06)
      coin.rotation.y = i * 0.6
      root.add(coin)
    }
    // Одна монетка прислонена к стопке, чтобы было живее
    const lean = coinMesh(face)
    lean.scale.setScalar(0.7)
    lean.rotation.set(Math.PI / 2 - 0.35, 0, 0.15)
    lean.position.set(0.95, -0.35, 0.35)
    root.add(lean)
    root.position.y = -(n * 0.22) / 2 + 0.75 - 0.35
  } else {
    // Самородок: икосаэдр с детерминированными «вмятинами», плоские грани
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i)
      const k = 0.82 + 0.28 * Math.abs(Math.sin(v.x * 3.1 + v.y * 2.3) * Math.cos(v.z * 2.7 - v.y))
      v.multiplyScalar(k)
      v.y *= 0.72
      p.setXYZ(i, v.x, v.y, v.z)
    }
    geo.computeVertexNormals()
    const nug = outlined(geo, toon({ color: GOLD, flatShading: true }), 1.06)
    nug.rotation.set(0.3, 0.4, 0.15)
    root.add(nug)
    // Маленький самородок рядом
    const small = outlined(geo, toon({ color: GOLD_EDGE, flatShading: true }), 1.08)
    small.scale.setScalar(0.38)
    small.position.set(1.05, -0.45, 0.3)
    root.add(small)
  }
  const dispose = () => {
    root.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
      }
    })
    face.dispose()
  }
  return { root, dispose }
}

function createStage(canvas, px, model, count, preserve = false) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: preserve })
  renderer.setPixelRatio(preserve ? 2 : Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(px, px, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 2.4)
  sun.position.set(-2.5, 4, 3)
  scene.add(sun)

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  if (model === 'stack') camera.position.set(0, 1.9, 4.6)
  else if (model === 'coin') camera.position.set(0, 0.6, 4.4)
  else camera.position.set(0, 1.4, 4.4)
  camera.lookAt(0, 0, 0)

  const { root, dispose: disposeModel } = buildModel(model, count)
  const pivot = new THREE.Group()
  pivot.add(root)
  scene.add(pivot)

  const dispose = () => { disposeModel(); renderer.dispose() }
  return { renderer, scene, camera, pivot, dispose }
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const snapshots = {}
function getSnapshot(model, count) {
  const key = `${model}:${count}`
  if (snapshots[key] !== undefined) return snapshots[key]
  try {
    const canvas = document.createElement('canvas')
    const st = createStage(canvas, 256, model, count, true)
    st.pivot.rotation.y = model === 'coin' ? -0.35 : 0.5
    st.renderer.render(st.scene, st.camera)
    snapshots[key] = canvas.toDataURL('image/png')
    st.dispose()
  } catch {
    snapshots[key] = ''
  }
  return snapshots[key]
}

function Sparkles({ size }) {
  const s = [
    { l: '8%', t: '14%', d: 0, k: 0.16 },
    { l: '82%', t: '8%', d: 0.7, k: 0.12 },
    { l: '88%', t: '62%', d: 1.3, k: 0.1 },
    { l: '4%', t: '70%', d: 1.9, k: 0.09 },
  ]
  return s.map((p, i) => (
    <svg key={i} viewBox="0 0 24 24" className="absolute anim-twinkle pointer-events-none" aria-hidden="true"
      style={{ left: p.l, top: p.t, width: size * p.k, height: size * p.k, animationDelay: `${p.d}s` }}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#fff4c2" stroke="#5b3a07" strokeWidth="1.2" />
    </svg>
  ))
}

export default function ToonGold({ model = 'coin', count = 4, size = 160, live = true, sparkle = false, className = '', label = 'Золото' }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const [img, setImg] = useState(() => (live ? null : snapshots[`${model}:${count}`] ?? null))

  useEffect(() => {
    if (live) return
    const go = () => setImg(getSnapshot(model, count))
    if (document.fonts?.ready) document.fonts.ready.then(go)
    else go()
  }, [live, model, count])

  useEffect(() => {
    if (!live) return
    const canvas = ref.current
    let st
    try { st = createStage(canvas, size, model, count) } catch { setFailed(true); return }
    const { renderer, scene, camera, pivot } = st
    let raf = 0, last = performance.now(), visible = true, drag = null, velocity = 0
    const still = reduced()
    const speed = model === 'coin' ? 1.1 : 0.55

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!drag) { pivot.rotation.y += (speed + velocity) * dt; velocity *= 0.94 }
      // Мультяшное «подпрыгивание»
      pivot.position.y = Math.abs(Math.sin(now / 520)) * 0.08
      if (model === 'nugget') pivot.rotation.x = Math.sin(now / 1400) * 0.12
      renderer.render(scene, camera)
      if (visible && !still) raf = requestAnimationFrame(frame)
    }
    if (still) { pivot.rotation.y = 0.5; renderer.render(scene, camera) } else raf = requestAnimationFrame(frame)

    const io = new IntersectionObserver(([e]) => {
      const was = visible
      visible = e.isIntersecting
      if (visible && !was && !still) { last = performance.now(); raf = requestAnimationFrame(frame) }
    })
    io.observe(canvas)

    const down = (e) => { drag = { x: e.clientX, t: performance.now() }; canvas.setPointerCapture(e.pointerId) }
    const move = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      pivot.rotation.y += dx * 0.012
      velocity = (dx * 0.012) / (Math.max(1, performance.now() - drag.t) / 1000)
      drag = { x: e.clientX, t: performance.now() }
      if (still) renderer.render(scene, camera)
    }
    const up = () => { drag = null; velocity = Math.max(-8, Math.min(8, velocity)) }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      st.dispose()
    }
  }, [live, model, count, size])

  const inner = failed || (!live && !img)
    ? <span className="bz-coin rounded-full block" style={{ width: size * 0.6, height: size * 0.6, margin: size * 0.2 }} aria-hidden="true" />
    : live
      ? <canvas ref={ref} role="img" aria-label={label} style={{ width: size, height: size, touchAction: 'pan-y' }} className="cursor-grab active:cursor-grabbing block" />
      : <img src={img} alt="" aria-hidden="true" width={size} height={size} draggable={false} className="block select-none pointer-events-none" />

  return (
    <span className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {inner}
      {sparkle && <Sparkles size={size} />}
    </span>
  )
}
