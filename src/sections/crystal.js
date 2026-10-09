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

// Faint lines on all twelve edges. They only help the silhouette, the glass carries the shape.
function keyframeEdges(geo) {
  const lines = new THREE.EdgesGeometry(geo, 1)
  const mat = new THREE.LineBasicMaterial({ color: 0xf4f4f1, transparent: true, opacity: 0.28 })
  return new THREE.LineSegments(lines, mat)
}

// The ink block behind the keyframe, drawn once on a canvas: soft lime and grey light streaks,
// bokeh and a faint After Effects timeline (tracks, ruler, keyframe diamonds). It stays dark,
// close to the page ink, and gives the glass something to bend and reflect.
export const BACKDROP = { w: 1600, h: 1000, ink: '#232323' }
export function drawBackdrop(ctx, { w, h, ink } = BACKDROP, rand = Math.random) {
  ctx.fillStyle = ink
  ctx.fillRect(0, 0, w, h)
  // Soft blob: a radial gradient squashed into a long ellipse, so no blur filter is needed
  const blob = (x, y, rx, ry, angle, rgb, a) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.scale(rx, ry)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g.addColorStop(0, `rgba(${rgb},${a})`)
    g.addColorStop(0.45, `rgba(${rgb},${a * 0.45})`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // Lime glow behind the keyframe (replaces the CSS glow, which the canvas covers)
  blob(w * 0.5, h * 0.5, w * 0.3, h * 0.42, 0, '145,193,30', 0.1)
  // Diagonal light streaks
  const streaks = [
    [0.18, 0.28, 0.42, 0.035, -0.5, '145,193,30', 0.16],
    [0.78, 0.7, 0.46, 0.03, -0.5, '145,193,30', 0.13],
    [0.6, 0.2, 0.5, 0.05, -0.5, '210,210,205', 0.07],
    [0.32, 0.82, 0.5, 0.045, -0.5, '210,210,205', 0.06],
    [0.9, 0.35, 0.3, 0.02, -0.5, '210,210,205', 0.08],
    [0.08, 0.6, 0.3, 0.025, -0.5, '145,193,30', 0.09]
  ]
  for (const [x, y, rx, ry, ang, rgb, a] of streaks) blob(w * x, h * y, w * rx, w * ry, ang, rgb, a)
  // Bokeh
  for (let i = 0; i < 26; i++) {
    const r = 14 + rand() * 46
    const lime = rand() < 0.35
    blob(rand() * w, rand() * h, r, r, 0, lime ? '145,193,30' : '230,230,225', (lime ? 0.09 : 0.05) + rand() * 0.05)
  }
  // Timeline: ruler ticks along the top, layer tracks, keyframe diamonds
  ctx.strokeStyle = 'rgba(244,244,241,0.05)'
  ctx.lineWidth = 2
  const rows = 9
  for (let r = 1; r <= rows; r++) {
    const y = (h * r) / (rows + 1)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(244,244,241,0.035)'
  for (let x = 0; x <= w; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  ctx.fillStyle = 'rgba(244,244,241,0.09)'
  for (let x = 0; x <= w; x += 20) ctx.fillRect(x, 0, 2, x % 80 ? 10 : 22)
  const diamond = (x, y, s) => {
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill()
  }
  for (let r = 1; r <= rows; r++) {
    const y = (h * r) / (rows + 1)
    let x = 40 + rand() * 160
    while (x < w - 20) {
      ctx.fillStyle = rand() < 0.25 ? 'rgba(145,193,30,0.2)' : 'rgba(244,244,241,0.08)'
      diamond(x, y, 9)
      x += 120 + rand() * 260
    }
  }
}

function backdropTexture() {
  const c = document.createElement('canvas')
  c.width = BACKDROP.w
  c.height = BACKDROP.h
  const ctx = c.getContext('2d')
  if (ctx) drawBackdrop(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// A studio for reflections: a dark room with a few softboxes (white strips and one lime card).
// Flat facets mirror them as clean bright bands that slide across the glass while it turns,
// and the dark walls keep the glass dark, so it stays on the black block.
function studioEnvironment() {
  const env = new THREE.Scene()
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x404040, side: THREE.BackSide }))
  env.add(room)
  const box = (w, h, color, strength, pos, rotY = 0, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }))
    m.position.set(...pos)
    m.rotation.set(rotX, rotY, 0)
    env.add(m)
  }
  box(9, 1.4, 0xffffff, 3, [0, 3.5, 9.5])                       // wide strip, front top
  box(12, 12, 0xffffff, 0.9, [0, 9.5, 0], 0, Math.PI / 2)       // soft top light
  box(5, 5, 0x91c11e, 1.6, [6, -2, 8], -0.6)                    // lime card, front right
  // A ring of tall strips all around, so a facet catches one at almost any angle of the spin
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    box(1.1, 9, 0xffffff, i % 2 ? 1.2 : 2.4, [Math.sin(a) * 9.5, i % 3 - 1, Math.cos(a) * 9.5], a + Math.PI)
  }
  return env
}

// Fresnel sheen over the glass half: faces glow faintly, more toward grazing angles, so the
// clear half keeps a readable body on the dark block at every angle of the spin. Additive,
// no depth write, drawn after the glass.
export function sheenMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { tint: { value: new THREE.Color(0xe8f2d8) }, base: { value: 0.06 }, rim: { value: 0.2 } },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 tint;
      uniform float base;
      uniform float rim;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float a = base + rim * pow(f, 2.0);
        // Back faces seen through the front ones glow less, so the near facets lead
        if (!gl_FrontFacing) a *= 0.5;
        gl_FragColor = vec4(tint * a, 1.0);
      }`
  })
}

// Glass with mass: full transmission with thickness and a low ior, so it bends the backdrop,
// plus clearcoat and a room environment for specular highlights and bright fresnel edges.
// Exported for the tests.
export function glassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.04,
    transmission: 1,
    thickness: 1.1,
    ior: 1.45,
    attenuationColor: new THREE.Color(0xc9d6bf),
    attenuationDistance: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
    envMapIntensity: 1,
    side: THREE.DoubleSide,
    flatShading: true,
    // No depth write, so the lime cut face and the far edges still draw behind it
    depthWrite: false
  })
}

// Idle spin and float, the mouse tilts and turns it. Returns { mesh, renderer }.
// The canvas gets .is-ready after the first frame, so it fades in over the plain ink block.
export function initCrystal(canvas, { reduced = false } = {}) {
  // Opaque canvas: the backdrop fills it, and the glass needs it for its transmission pass
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x232323, 1)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.35, 6)
  camera.lookAt(0, 0, 0)

  // Studio environment, prefiltered once: reflections and highlights for the glass and the clearcoat
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(studioEnvironment(), 0.02).texture
  pmrem.dispose()

  // Backdrop plane far behind the keyframe, sized in resize() to cover the whole view
  const BACK_Z = -4
  const backMat = new THREE.MeshBasicMaterial({ map: backdropTexture(), toneMapped: false })
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backMat)
  backdrop.position.z = BACK_Z
  scene.add(backdrop)

  // Solid lime #91C11E half with a light clearcoat, and the glass half. Polygon offset pushes the
  // lime faces back a little, so the edge lines sit cleanly on top. A see-through lime cut face
  // closes the solid half. It is transparent, so it stays out of the transmission pass and the
  // glass bends the backdrop, not a lime wall.
  const offset = { flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }
  const lime = new THREE.MeshPhysicalMaterial({ color: 0x91c11e, roughness: 0.6, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 0.12, ...offset })
  const cut = new THREE.Mesh(cutFace(), new THREE.MeshBasicMaterial({ color: 0x91c11e, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }))
  const glass = glassMaterial()
  const geo = keyframeGeometry()
  const slab = new THREE.Mesh(geo, [lime, glass])
  // Glass half only (second group), for the sheen pass
  const glassGeo = new THREE.BufferGeometry()
  const half = geo.attributes.position.count / 2
  glassGeo.setAttribute('position', new THREE.BufferAttribute(geo.attributes.position.array.slice(half * 3), 3))
  glassGeo.setAttribute('normal', new THREE.BufferAttribute(geo.attributes.normal.array.slice(half * 3), 3))
  const sheen = new THREE.Mesh(glassGeo, sheenMaterial())
  sheen.renderOrder = 2
  // (three.js lights are physical, so a diffuse face gets intensity / PI: hence the high values)
  scene.add(new THREE.AmbientLight(0xffffff, 1.3))
  const key = new THREE.DirectionalLight(0xffffff, 1.3)
  key.position.set(-2, 3, 4)
  // Soft fill from below right so the bevels on the far side do not go flat
  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(3, -2, 2)
  scene.add(key, fill)

  const mesh = new THREE.Group()
  mesh.add(slab, cut, sheen, keyframeEdges(geo))
  scene.add(mesh)

  // spin = idle rotation, yaw = mouse offset. Kept apart so easing never cancels the spin.
  // Starts turned a little: lime half left, glass half right and turned toward the camera,
  // so the glass catches the studio strips in the first (and the reduced motion) frame
  let spin = -0.12
  let yaw = 0
  const target = { x: 0, y: 0, px: 0, py: 0 }

  const render = () => {
    renderer.render(scene, camera)
    canvas.classList.add('is-ready')
  }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    // DPR can change when the window moves between screens
    // Capped: the glass renders the scene twice (transmission pass), so keep the buffer modest
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // Keyframe height = about 60% of the black block, never wider than half of it
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const visW = visH * camera.aspect
    mesh.scale.setScalar(Math.min((visW * 0.5) / (2 * R), (visH * 0.6) / (2 * H)))
    // Backdrop covers the view at its depth (a little extra for the tilted camera), image kept
    // at its own aspect like background-size: cover
    const dist = camera.position.z - BACK_Z
    const bh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.12
    const bw = bh * camera.aspect
    backdrop.scale.set(bw, bh, 1)
    const map = backMat.map
    const img = BACKDROP.w / BACKDROP.h
    const view = bw / bh
    map.repeat.set(view < img ? view / img : 1, view < img ? 1 : img / view)
    map.offset.set((1 - map.repeat.x) / 2, (1 - map.repeat.y) / 2)
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
