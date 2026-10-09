import * as THREE from 'three'

// The cut gem from the showreel machine shot, seen from the side: flat table on top, a short
// crown (about 20% of the height), the girdle as the widest point and a long V pavilion down
// to a point. Width : height = 1.4 : 1. Low-poly, flat shaded, icy white-blue.
const SIDES = 10
const W = 1.4 // girdle diameter
const H = 1 // table to culet
const CROWN = 0.2 // crown height, share of H
const TABLE = 0.62 // table radius, share of the girdle radius
const MID = 0.42 // pavilion break ring height, share of the pavilion

// Non-indexed triangle list, so every facet gets its own flat normal.
// Exported for the tests. Centered on the origin, y up.
export function gemPositions() {
  const R = W / 2
  const top = H / 2
  const girdleY = top - CROWN * H
  const bottom = -H / 2
  const midY = girdleY - MID * (girdleY - bottom)
  // Break ring sits a touch outside the straight girdle-to-culet line, so the pavilion reads as facets
  const midR = R * (1 - MID) * 1.08
  const ring = (r, y, offset) => Array.from({ length: SIDES }, (_, k) => {
    const a = ((k + offset) / SIDES) * Math.PI * 2
    return [Math.cos(a) * r, y, Math.sin(a) * r]
  })
  const table = ring(R * TABLE, top, 0.5)
  const girdle = ring(R, girdleY, 0)
  const mid = ring(midR, midY, 0.5)
  const crownTop = [0, top, 0]
  const culet = [0, bottom, 0]
  const tris = []
  for (let k = 0; k < SIDES; k++) {
    const n = (k + 1) % SIDES
    // table (one flat face as a fan)
    tris.push(crownTop, table[n], table[k])
    // crown: star and bezel facets between table and girdle
    tris.push(girdle[k], table[k], girdle[n])
    tris.push(table[k], table[n], girdle[n])
    // pavilion: girdle facets, then the long mains down to the culet
    tris.push(girdle[n], mid[k], girdle[k])
    tris.push(girdle[n], mid[n], mid[k])
    tris.push(mid[k], mid[n], culet)
  }
  return new Float32Array(tris.flat())
}

export function gemGeometry() {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(gemPositions(), 3))
  geo.computeVertexNormals()
  return geo
}

// Idle spin and float, the mouse tilts and turns it. Returns { mesh, renderer }.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.35, 6)
  camera.lookAt(0, 0, 0)

  // Palette from the reel: brightest #FAFEFF, mids #E0EAF3 / #C4D4EA, shadow #BACDE0.
  // A strong cold ambient keeps the darkest facets at the shadow tone, the key light lifts the rest.
  const gem = new THREE.Mesh(gemGeometry(), new THREE.MeshLambertMaterial({ color: 0xe0eaf3, flatShading: true }))
  // (three.js lights are physical, so a diffuse face gets intensity / PI: hence the high values)
  scene.add(new THREE.AmbientLight(0xdde8f5, 2.5))
  const key = new THREE.DirectionalLight(0xfafeff, 2.2)
  key.position.set(-2, 3, 4)
  // Faint lime rim from behind so the edges glow a little on the black
  const rim = new THREE.DirectionalLight(0x91c11e, 1.6)
  rim.position.set(3, -1, -4)
  scene.add(key, rim)

  const mesh = new THREE.Group()
  mesh.add(gem)
  // Slight forward lean so the table and the crown facets catch the light
  gem.rotation.x = 0.12
  scene.add(mesh)

  // spin = idle rotation, yaw = mouse offset. Kept apart so easing never cancels the spin.
  let spin = 0.4
  let yaw = 0
  const target = { x: 0, y: 0, px: 0, py: 0 }

  const render = () => renderer.render(scene, camera)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    // DPR can change when the window moves between screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // Gem width = about half of the shorter side of the black block
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const visW = visH * camera.aspect
    mesh.scale.setScalar((Math.min(visW, visH * 1.25) * 0.5) / W)
    if (reduced) render()
  }

  window.addEventListener('resize', resize)
  resize()

  // Reduced motion: one static frame, the gem does not follow the mouse
  if (reduced) {
    mesh.rotation.y = spin
    render()
    return { mesh, renderer }
  }

  window.addEventListener('pointermove', e => {
    const nx = e.clientX / window.innerWidth - 0.5
    const ny = e.clientY / window.innerHeight - 0.5
    // Wide range so the gem clearly answers the mouse, the easing in tick keeps it smooth
    target.y = nx * 4.4
    target.x = ny * 1.3
    target.px = nx * 0.35
    target.py = -ny * 0.25
  })

  let raf = 0
  let last = 0
  let time = 0
  const tick = now => {
    // Normalise to 60fps so 120Hz screens do not spin twice as fast
    const dt = last ? Math.min((now - last) / (1000 / 60), 4) : 1
    last = now
    time += dt / 60
    spin += 0.006 * dt
    const k = 1 - Math.pow(1 - 0.08, dt)
    yaw += (target.y - yaw) * k
    mesh.rotation.x += (target.x - mesh.rotation.x) * k
    mesh.rotation.z += (-target.y * 0.06 - mesh.rotation.z) * k
    mesh.rotation.y = spin + yaw
    mesh.position.x += (target.px - mesh.position.x) * k
    // Float bob on top of the mouse offset
    const bob = Math.sin(time * 1.4) * 0.07
    mesh.position.y += (target.py + bob - mesh.position.y) * k
    render()
    raf = requestAnimationFrame(tick)
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }
  const stop = () => { cancelAnimationFrame(raf); raf = 0 }

  // Only render while the gem is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas)
  } else {
    start()
  }
  return { mesh, renderer }
}
