import * as THREE from 'three'

// The AE keyframe diamond as a 3D octahedron. Idle spin, follows the mouse.
// Returns { mesh, renderer } so the timeline can reuse the shape later.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.z = 5

  const geo = new THREE.OctahedronGeometry(1.2, 0)
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x91c11e, transparent: true, opacity: 0.35 }))
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x232323 }))
  const mesh = new THREE.Group()
  mesh.add(fill, edges)
  scene.add(mesh)

  // spin = idle rotation, yaw = mouse offset. Kept apart so easing never cancels the spin.
  let spin = 0
  let yaw = 0
  const target = { x: 0, y: 0 }

  const render = () => renderer.render(scene, camera)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    // DPR can change when the window moves between screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (reduced) render()
  }

  window.addEventListener('pointermove', e => {
    target.y = (e.clientX / window.innerWidth - 0.5) * 1.6
    target.x = (e.clientY / window.innerHeight - 0.5) * 1.2
    if (reduced) {
      // No animation: jump straight to the pose and draw one frame
      mesh.rotation.set(target.x, target.y, 0)
      render()
    }
  })
  window.addEventListener('resize', resize)
  resize()

  if (reduced) {
    render()
    return { mesh, renderer }
  }

  let raf = 0
  let last = 0
  const tick = now => {
    // Normalise to 60fps so 120Hz screens do not spin twice as fast
    const dt = last ? Math.min((now - last) / (1000 / 60), 4) : 1
    last = now
    spin += 0.004 * dt
    const k = 1 - Math.pow(1 - 0.06, dt)
    yaw += (target.y - yaw) * k
    mesh.rotation.x += (target.x - mesh.rotation.x) * k
    mesh.rotation.y = spin + yaw
    render()
    raf = requestAnimationFrame(tick)
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }
  const stop = () => { cancelAnimationFrame(raf); raf = 0 }

  // Only render while the crystal is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas)
  } else {
    start()
  }
  return { mesh, renderer }
}
