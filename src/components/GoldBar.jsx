import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/*
  3D-слиток золота.
  live      — WebGL-сцена: медленно вращается, крутится пальцем/мышью, ставится на паузу вне экрана.
  live=false — статичный снимок той же модели (один раз рендерится и кешируется), для мелких иконок,
               чтобы на экране не было десятка WebGL-контекстов.
*/

const GOLD = 0xf0bd4f

// Гравировка на верхней грани: цветовая карта и карта рельефа
function engraving() {
  const make = (paint) => {
    const c = document.createElement('canvas')
    c.width = 1024; c.height = 512
    const g = c.getContext('2d')
    paint(g, c)
    const t = new THREE.CanvasTexture(c)
    t.anisotropy = 4
    return t
  }
  const text = (g, color, dy = 0) => {
    g.fillStyle = color
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = '600 92px "Unbounded", "Onest", sans-serif'
    g.fillText('BOZZIHYRA', 512, 150 + dy)
    g.font = '700 150px "Unbounded", "Onest", sans-serif'
    g.fillText('999,9', 512, 290 + dy)
    g.font = '500 64px "Onest", sans-serif'
    g.fillText('FINE GOLD · 1 g', 512, 410 + dy)
  }
  const map = make((g, c) => {
    g.fillStyle = '#f0bd4f'; g.fillRect(0, 0, c.width, c.height)
    g.strokeStyle = 'rgba(120,80,10,.45)'; g.lineWidth = 10; g.strokeRect(40, 40, c.width - 80, c.height - 80)
    text(g, 'rgba(255,240,200,.55)', 3)
    text(g, 'rgba(110,72,8,.85)')
  })
  map.colorSpace = THREE.SRGBColorSpace
  const bump = make((g, c) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height)
    g.strokeStyle = '#000'; g.lineWidth = 10; g.strokeRect(40, 40, c.width - 80, c.height - 80)
    text(g, '#000')
  })
  return { map, bump }
}

// Усечённая пирамида: верх уже низа, как у настоящего слитка
function buildBar() {
  const geo = new THREE.BoxGeometry(2.4, 0.72, 1.25)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) { pos.setX(i, pos.getX(i) * 0.8); pos.setZ(i, pos.getZ(i) * 0.74) }
  }
  geo.computeVertexNormals()
  const { map, bump } = engraving()
  const side = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.15 })
  const top = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, bumpMap: bump, bumpScale: 1.4, metalness: 1, roughness: 0.26, clearcoat: 0.3 })
  // Порядок граней BoxGeometry: +x, -x, +y (верх), -y, +z, -z
  const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side])
  const dispose = () => { geo.dispose(); side.dispose(); top.dispose(); map.dispose(); bump.dispose() }
  return { mesh, dispose }
}

function createStage(canvas, px, { preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: preserve })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(px, px, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex

  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 5, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xfff1d6, 0.9)
  fill.position.set(-4, 2, 3)
  scene.add(fill)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 1.55, 5.2)
  camera.lookAt(0, 0, 0)

  const { mesh, dispose: disposeBar } = buildBar()
  const pivot = new THREE.Group()
  pivot.add(mesh)
  pivot.rotation.x = 0.18
  scene.add(pivot)

  const dispose = () => { disposeBar(); envTex.dispose(); pmrem.dispose(); renderer.dispose() }
  return { renderer, scene, camera, pivot, dispose }
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Снимок для статичных иконок: рендерится один раз
let snapshot = null
function getSnapshot() {
  if (snapshot !== null) return snapshot
  try {
    const canvas = document.createElement('canvas')
    const stage = createStage(canvas, 256, { preserve: true })
    stage.renderer.setPixelRatio(2)
    stage.renderer.setSize(256, 256, false)
    stage.pivot.rotation.y = 0.55
    stage.renderer.render(stage.scene, stage.camera)
    snapshot = canvas.toDataURL('image/png')
    stage.dispose()
  } catch {
    snapshot = ''
  }
  return snapshot
}

function Fallback({ size, className }) {
  return <span className={`bz-ingot inline-block ${className}`} style={{ width: size, height: size * 0.55 }} aria-hidden="true" />
}

export default function GoldBar({ size = 160, live = true, className = '', label = 'Слиток золота' }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const [img, setImg] = useState(() => (live ? null : snapshot))

  useEffect(() => {
    if (live || img !== null) return
    // Шрифты для гравировки должны загрузиться до снимка
    const go = () => setImg(getSnapshot())
    if (document.fonts?.ready) document.fonts.ready.then(go)
    else go()
  }, [live, img])

  useEffect(() => {
    if (!live) return
    const canvas = ref.current
    let stage
    try { stage = createStage(canvas, size) } catch { setFailed(true); return }
    const { renderer, scene, camera, pivot } = stage

    let raf = 0, last = performance.now(), visible = true
    let spin = 0.7          // базовая скорость вращения, рад/сек
    let velocity = 0        // добавка от перетаскивания
    let drag = null
    const still = reduced()

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!drag) {
        pivot.rotation.y += (spin + velocity) * dt
        velocity *= 0.94
      }
      pivot.position.y = Math.sin(now / 900) * 0.06
      renderer.render(scene, camera)
      if (visible && !still) raf = requestAnimationFrame(frame)
    }

    if (still) { pivot.rotation.y = 0.55; renderer.render(scene, camera) }
    else raf = requestAnimationFrame(frame)

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
      const dtm = Math.max(1, performance.now() - drag.t)
      velocity = (dx * 0.012) / (dtm / 1000)
      drag = { x: e.clientX, t: performance.now() }
      if (still) renderer.render(scene, camera)
    }
    const up = () => { drag = null; velocity = Math.max(-8, Math.min(8, velocity)) }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    // Шрифты гравировки подгружаются асинхронно: перестраиваем текстуру, когда они готовы
    const fontsPending = document.fonts && document.fonts.status !== 'loaded'
    if (fontsPending) document.fonts.ready.then(() => {
      if (!stage) return
      const old = pivot.children[0]
      const { mesh } = buildBar()
      pivot.remove(old)
      old.geometry.dispose()
      old.material.forEach((m) => { m.map?.dispose(); m.bumpMap?.dispose(); m.dispose() })
      pivot.add(mesh)
      if (still) renderer.render(scene, camera)
    })

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      pivot.children.forEach((m) => { m.geometry.dispose(); m.material.forEach((x) => { x.map?.dispose(); x.bumpMap?.dispose(); x.dispose() }) })
      stage.dispose()
      stage = null
    }
  }, [live, size])

  if (failed) return <Fallback size={size} className={className} />
  if (!live) {
    if (!img) return <Fallback size={size} className={className} />
    return <img src={img} alt="" aria-hidden="true" width={size} height={size} className={`select-none pointer-events-none ${className}`} draggable={false} />
  }
  return <canvas ref={ref} role="img" aria-label={label} style={{ width: size, height: size, touchAction: 'pan-y' }} className={`cursor-grab active:cursor-grabbing ${className}`} />
}
