import * as THREE from 'three'

// An After Effects keyframe seen in 3D: a diamond with a square waist (four points around
// the middle) and a tip above and below at the same distance, so the top half mirrors the
// bottom half. A little taller than a regular octahedron. Split left/right through the tips:
// the left half is solid lime, the right half is clear glass, like a selected keyframe.
const R = 1 // center to each middle point
const H = 1.18 // center to each tip
export const KEYFRAME = { R, H }

// Non-indexed triangle list, so every facet gets its own flat normal. Left half (x <= 0)
// first, then the right half: four facets each. Exported for the tests.
export function keyframePositions() {
  const top = [0, H, 0]
  const bottom = [0, -H, 0]
  const front = [0, 0, R]
  const back = [0, 0, -R]
  const half = sx => {
    const side = [sx * R, 0, 0]
    const tris = []
    // Wound so the normal points out, mirrored for the right half
    const tri = (a, b, c) => tris.push(...(sx < 0 ? [a, b, c] : [a, c, b]))
    tri(top, side, front)
    tri(top, back, side)
    tri(bottom, front, side)
    tri(bottom, side, back)
    return tris
  }
  return new Float32Array([...half(-1), ...half(1)].flat())
}

export function keyframeGeometry() {
  const positions = keyframePositions()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  const half = positions.length / 6 // vertices per half
  geo.addGroup(0, half, 0)
  geo.addGroup(half, half, 1)
  return geo
}

// The cut face of the solid half: the square through both tips and the front and back points.
// Seen through the glass, it shows the lime half is solid, not a hollow shell.
function cutFace() {
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, H, 0, 0, 0, R, 0, -H, 0, 0, H, 0, 0, -H, 0, 0, 0, -R], 3))
  geo.computeVertexNormals()
  return geo
}

// Light lines on all twelve edges, so the shape reads on the black block. The edges behind
// the glass half stay visible through it.
function keyframeEdges(geo) {
  const lines = new THREE.EdgesGeometry(geo, 1)
  const mat = new THREE.LineBasicMaterial({ color: 0xf4f4f1, transparent: true, opacity: 0.9 })
  return new THREE.LineSegments(lines, mat)
}

// Idle spin and float, the mouse tilts and turns it. Returns { mesh, renderer }.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.35, 6)
  camera.lookAt(0, 0, 0)

  // Solid lime #91C11E half and a clear glass half. Polygon offset pushes the faces back a
  // little, so the edge lines sit cleanly on top. A see-through lime cut face closes the solid half.
  // The glass does not write depth, so the far edges stay visible through it.
  const offset = { flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }
  const lime = new THREE.MeshLambertMaterial({ color: 0x91c11e, ...offset })
  const cut = new THREE.Mesh(cutFace(), new THREE.MeshLambertMaterial({ color: 0x91c11e, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, ...offset }))
  const glass = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, ...offset })
  const geo = keyframeGeometry()
  const slab = new THREE.Mesh(geo, [lime, glass])
  // (three.js lights are physical, so a diffuse face gets intensity / PI: hence the high values)
  scene.add(new THREE.AmbientLight(0xffffff, 1.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.5)
  key.position.set(-2, 3, 4)
  // Soft fill from below right so the bevels on the far side do not go flat
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(3, -2, 2)
  scene.add(key, fill)

  const mesh = new THREE.Group()
  mesh.add(slab, cut, keyframeEdges(geo))
  scene.add(mesh)

  // spin = idle rotation, yaw = mouse offset. Kept apart so easing never cancels the spin.
  // Starts turned a little: lime half left, glass half right, both read at once
  let spin = 0.3
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
    // Keyframe height = about 60% of the black block, never wider than half of it
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const visW = visH * camera.aspect
    mesh.scale.setScalar(Math.min((visW * 0.5) / (2 * R), (visH * 0.6) / (2 * H)))
    if (reduced) render()
  }

  window.addEventListener('resize', resize)
  resize()

  // Reduced motion: one static frame, the keyframe does not follow the mouse
  if (reduced) {
    mesh.rotation.y = spin
    render()
    return { mesh, renderer }
  }

  window.addEventListener('pointermove', e => {
    const nx = e.clientX / window.innerWidth - 0.5
    const ny = e.clientY / window.innerHeight - 0.5
    // Wide range so the keyframe clearly answers the mouse, the easing in tick keeps it smooth
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

  // Only render while the keyframe is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas)
  } else {
    start()
  }
  return { mesh, renderer }
}
