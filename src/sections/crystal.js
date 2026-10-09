import * as THREE from 'three'

// The AE keyframe diamond as a 3D octahedron. Idle spin, follows the mouse.
// Returns { mesh, renderer } so the timeline can reuse the shape later.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.z = 5

  const geo = new THREE.OctahedronGeometry(1.2, 0)
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x91c11e, transparent: true, opacity: 0.35 }))
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x232323 }))
  const mesh = new THREE.Group()
  mesh.add(fill, edges)
  scene.add(mesh)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const target = { x: 0, y: 0 }
  window.addEventListener('pointermove', e => {
    target.y = (e.clientX / window.innerWidth - 0.5) * 1.6
    target.x = (e.clientY / window.innerHeight - 0.5) * 1.2
  })

  const tick = () => {
    if (!reduced) mesh.rotation.y += 0.004
    mesh.rotation.x += (target.x - mesh.rotation.x) * 0.06
    mesh.rotation.y += (target.y - (mesh.rotation.y % (Math.PI * 2))) * 0.01
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  tick()
  return { mesh, renderer }
}
