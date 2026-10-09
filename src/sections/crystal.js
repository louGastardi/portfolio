import * as THREE from 'three'

// An After Effects keyframe as a 3D slab: a square turned 45 degrees, extruded, with a small
// bevel on the front and back edges. Left half lime, right half white, like the logo.
const R = 1 // center to tip
const DEPTH = 0.34 // full thickness
const BEVEL = 0.07 // bevel width (and depth) on each face
const W = 2 * R // tip to tip

// Non-indexed triangle list, so every facet gets its own flat normal. Left half (x <= 0)
// first, then the right half: both halves have the same triangle count. Exported for the tests.
export function keyframePositions() {
  const d = DEPTH / 2
  const inner = R - BEVEL * Math.SQRT2 // face diamond, shrunk so the bevel is 45 degrees
  // Diamond corners for one half: top, side tip, bottom. sx = -1 left, +1 right.
  const corners = (r, z, sx) => [[0, r, z], [sx * r, 0, z], [0, -r, z]]
  const half = sx => {
    const tris = []
    const ff = corners(inner, d, sx) // front face
    const fo = corners(R, d - BEVEL, sx) // front bevel, outer ring
    const bo = corners(R, -d + BEVEL, sx) // back bevel, outer ring
    const bf = corners(inner, -d, sx) // back face
    // Triangles wound so the normal points out, mirrored for the right half
    const tri = (a, b, c) => tris.push(...(sx < 0 ? [a, b, c] : [a, c, b]))
    const quad = (a, b, c, e) => { tri(a, b, c); tri(a, c, e) }
    tri(ff[0], ff[1], ff[2])
    tri(bf[0], bf[2], bf[1])
    for (let k = 0; k < 2; k++) {
      quad(ff[k], fo[k], fo[k + 1], ff[k + 1]) // front bevel
      quad(fo[k], bo[k], bo[k + 1], fo[k + 1]) // side band
      quad(bo[k], bf[k], bf[k + 1], bo[k + 1]) // back bevel
    }
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

// Thin ink lines on every fold plus the split between the halves, front and back
function keyframeEdges(geo) {
  const lines = new THREE.EdgesGeometry(geo, 10)
  const d = DEPTH / 2 + 0.002
  const inner = R - BEVEL * Math.SQRT2
  const split = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, inner, d, 0, -inner, d, 0, inner, -d, 0, -inner, -d], 3))
  const mat = new THREE.LineBasicMaterial({ color: 0x232323 })
  const group = new THREE.Group()
  group.add(new THREE.LineSegments(lines, mat), new THREE.LineSegments(split, mat))
  return group
}

// Idle spin and float, the mouse tilts and turns it. Returns { mesh, renderer }.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.35, 6)
  camera.lookAt(0, 0, 0)

  // Lime #91C11E and off-white halves. Polygon offset pushes the faces back a little,
  // so the ink edge lines sit cleanly on top.
  const face = color => new THREE.MeshLambertMaterial({ color, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const geo = keyframeGeometry()
  const slab = new THREE.Mesh(geo, [face(0x91c11e), face(0xf4f4f1)])
  // (three.js lights are physical, so a diffuse face gets intensity / PI: hence the high values)
  scene.add(new THREE.AmbientLight(0xffffff, 1.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.5)
  key.position.set(-2, 3, 4)
  // Soft fill from below right so the bevels on the far side do not go flat
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(3, -2, 2)
  scene.add(key, fill)

  const mesh = new THREE.Group()
  mesh.add(slab, keyframeEdges(geo))
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
    // Keyframe width = about half of the shorter side of the black block
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const visW = visH * camera.aspect
    mesh.scale.setScalar((Math.min(visW, visH * 1.25) * 0.5) / W)
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
