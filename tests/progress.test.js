import { describe, it, expect } from 'vitest'
import { clamp, activeIndex } from '../src/lib/progress.js'

describe('clamp', () => {
  it('limits to range', () => {
    expect(clamp(-1, 0, 1)).toBe(0)
    expect(clamp(2, 0, 1)).toBe(1)
    expect(clamp(0.4, 0, 1)).toBe(0.4)
  })
})

describe('activeIndex', () => {
  it('maps progress 0..1 to evenly split slots', () => {
    expect(activeIndex(0, 5)).toBe(0)
    expect(activeIndex(0.19, 5)).toBe(0)
    expect(activeIndex(0.2, 5)).toBe(1)
    expect(activeIndex(0.99, 5)).toBe(4)
  })
  it('keeps the last slot at progress 1', () => {
    expect(activeIndex(1, 5)).toBe(4)
  })
  it('clamps out-of-range progress', () => {
    expect(activeIndex(-0.5, 5)).toBe(0)
    expect(activeIndex(3, 5)).toBe(4)
  })
})
