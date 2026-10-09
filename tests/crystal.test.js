import { describe, it, expect } from 'vitest'
import { keyframePositions } from '../src/sections/crystal.js'

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
  it('is a square diamond: as wide as tall, tips on the axes, thinner than wide', () => {
    const v = points()
    const xs = v.map(p => p[0]), ys = v.map(p => p[1]), zs = v.map(p => p[2])
    const w = Math.max(...xs) - Math.min(...xs)
    const h = Math.max(...ys) - Math.min(...ys)
    const d = Math.max(...zs) - Math.min(...zs)
    expect(w).toBeCloseTo(h, 6)
    expect(Math.max(...xs)).toBeCloseTo(-Math.min(...xs), 6)
    expect(Math.max(...ys)).toBeCloseTo(-Math.min(...ys), 6)
    expect(d / w).toBeGreaterThan(0.1)
    expect(d / w).toBeLessThan(0.3)
    // The tips sit on the axes, so the outline is a square turned 45 degrees
    expect(v.some(p => p[0] === 0 && p[1] === Math.max(...ys))).toBe(true)
    expect(v.some(p => p[1] === 0 && p[0] === Math.max(...xs))).toBe(true)
  })

  it('is mirror symmetric left to right and front to back', () => {
    const v = points()
    for (const [x, y, z] of v) {
      expect(has(v, [-x, y, z])).toBe(true)
      expect(has(v, [x, y, -z])).toBe(true)
    }
  })

  it('splits into a left half and a right half of equal size', () => {
    const t = tris()
    const half = t.length / 2
    expect(Number.isInteger(half)).toBe(true)
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
