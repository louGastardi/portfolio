import { describe, it, expect } from 'vitest'
import { gemPositions } from '../src/sections/crystal.js'

const tris = () => {
  const p = gemPositions()
  const out = []
  for (let i = 0; i < p.length; i += 9) out.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]], [p[i + 6], p[i + 7], p[i + 8]]])
  return out
}
const sub = (a, b) => a.map((v, i) => v - b[i])
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

describe('gem geometry', () => {
  it('is 1.4 times wider than tall, flat on top, pointed at the bottom', () => {
    const p = gemPositions()
    const xs = [], ys = []
    for (let i = 0; i < p.length; i += 3) { xs.push(p[i]); ys.push(p[i + 1]) }
    const w = Math.max(...xs) - Math.min(...xs)
    const h = Math.max(...ys) - Math.min(...ys)
    expect(w / h).toBeCloseTo(1.4, 1)
    // The widest ring (girdle) sits about 20% below the top
    const top = Math.max(...ys)
    const girdleY = ys[xs.indexOf(Math.max(...xs))]
    expect((top - girdleY) / h).toBeCloseTo(0.2, 2)
  })

  it('has every facet facing outward, so flat shading lights the right side', () => {
    for (const [a, b, c] of tris()) {
      const n = cross(sub(b, a), sub(c, a))
      const centroid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
      expect(dot(n, centroid)).toBeGreaterThan(0)
    }
  })
})
