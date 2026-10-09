import { describe, it, expect } from 'vitest'
import { keyframePositions, KEYFRAME } from '../src/sections/crystal.js'

const points = () => {
  const p = keyframePositions()
  const out = []
  for (let i = 0; i < p.length; i += 3) out.push([p[i], p[i + 1], p[i + 2]])
  return out
}
const tris = () => {
  const v = points()
  const out = []
  for (let i = 0; i < v.length; i += 3) out.push([v[i], v[i + 1], v[i + 2]])
  return out
}
const sub = (a, b) => a.map((v, i) => v - b[i])
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const has = (list, [x, y, z]) => list.some(q => Math.abs(q[0] - x) < 1e-6 && Math.abs(q[1] - y) < 1e-6 && Math.abs(q[2] - z) < 1e-6)

describe('keyframe geometry', () => {
  it('is a diamond with a square waist and two tips at equal distance', () => {
    const v = points()
    const xs = v.map(p => p[0]), ys = v.map(p => p[1]), zs = v.map(p => p[2])
    const w = Math.max(...xs) - Math.min(...xs)
    const d = Math.max(...zs) - Math.min(...zs)
    const h = Math.max(...ys) - Math.min(...ys)
    // Square cross-section: as deep as wide
    expect(w).toBeCloseTo(d, 6)
    // Tips as far up as down, a regular octahedron or a little taller
    expect(Math.max(...ys)).toBeCloseTo(-Math.min(...ys), 6)
    expect(h / w).toBeGreaterThanOrEqual(1)
    expect(h / w).toBeLessThan(1.35)
    // Six corners: two tips on the y axis, four waist points on the x and z axes
    const { R, H } = KEYFRAME
    for (const c of [[0, H, 0], [0, -H, 0], [R, 0, 0], [-R, 0, 0], [0, 0, R], [0, 0, -R]]) expect(has(v, c)).toBe(true)
    expect(v.every(p => has([[0, H, 0], [0, -H, 0], [R, 0, 0], [-R, 0, 0], [0, 0, R], [0, 0, -R]], p))).toBe(true)
  })

  it('is mirror symmetric top to bottom, left to right and front to back', () => {
    const v = points()
    for (const [x, y, z] of v) {
      expect(has(v, [x, -y, z])).toBe(true)
      expect(has(v, [-x, y, z])).toBe(true)
      expect(has(v, [x, y, -z])).toBe(true)
    }
  })

  it('mirrors every facet of the top half in the bottom half', () => {
    const t = tris()
    const key = tri => tri.map(p => p.map(n => n.toFixed(5)).join(',')).sort().join('|')
    const all = new Set(t.map(key))
    const top = t.filter(tri => tri.some(p => p[1] > 0))
    expect(top.length).toBe(t.length / 2)
    top.forEach(tri => expect(all.has(key(tri.map(([x, y, z]) => [x, -y, z])))).toBe(true))
  })

  it('splits into a left half and a right half of equal size', () => {
    const t = tris()
    const half = t.length / 2
    expect(t.length).toBe(8)
    t.slice(0, half).forEach(tri => tri.forEach(p => expect(p[0]).toBeLessThanOrEqual(1e-9)))
    t.slice(half).forEach(tri => tri.forEach(p => expect(p[0]).toBeGreaterThanOrEqual(-1e-9)))
  })

  it('has every facet facing outward, so flat shading lights the right side', () => {
    for (const [a, b, c] of tris()) {
      const n = cross(sub(b, a), sub(c, a))
      const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
      expect(dot(n, centroid)).toBeGreaterThan(0)
    }
  })
})

describe('keyframe glass and backdrop', () => {
  it('makes the glass half real glass: full transmission, thickness, ior 1.45, clearcoat', async () => {
    const { glassMaterial } = await import('../src/sections/crystal.js')
    const m = glassMaterial()
    expect(m.transmission).toBe(1)
    expect(m.thickness).toBeGreaterThan(0)
    expect(m.ior).toBeCloseTo(1.45, 2)
    expect(m.roughness).toBeLessThan(0.15)
    expect(m.clearcoat).toBeGreaterThan(0)
    expect(m.metalness).toBe(0)
  })

  it('draws a dark backdrop: ink base and only faint, low-alpha light on top', async () => {
    const { drawBackdrop, BACKDROP } = await import('../src/sections/crystal.js')
    const colors = []
    const grad = { addColorStop: (_, c) => colors.push(c) }
    const ctx = new Proxy({}, {
      get: (t, k) => (k in t ? t[k] : k === 'createRadialGradient' ? () => grad : () => {}),
      set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle') colors.push(v); t[k] = v; return true }
    })
    let seed = 1
    drawBackdrop(ctx, BACKDROP, () => ((seed = (seed * 16807) % 2147483647) / 2147483647))
    expect(colors[0]).toBe(BACKDROP.ink)
    const alphas = colors.filter(c => typeof c === 'string' && c.startsWith('rgba')).map(c => parseFloat(c.split(',')[3]))
    expect(alphas.length).toBeGreaterThan(20)
    alphas.forEach(a => expect(a).toBeLessThanOrEqual(0.2))
  })
})
