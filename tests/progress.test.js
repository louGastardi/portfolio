import { describe, it, expect } from 'vitest'
import { clamp, activeIndex, dwellPhase } from '../src/lib/progress.js'

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

describe('dwellPhase', () => {
  // 10 stops, 3.4 s wait + 0.8 s trip = 4.2 s per stop, 42 s per lap
  const at = ms => dwellPhase(ms, 10, 3400, 800)
  it('waits on the first stop at the start', () => {
    expect(at(0)).toEqual({ step: 0, trip: 0 })
    expect(at(3399)).toEqual({ step: 0, trip: 0 })
  })
  it('travels to the next stop after the wait', () => {
    expect(at(3400)).toEqual({ step: 0, trip: 0 })
    expect(at(3800).trip).toBeCloseTo(0.5)
    expect(at(4200)).toEqual({ step: 1, trip: 0 })
  })
  it('waits on every stop for the full dwell', () => {
    for (let i = 0; i < 10; i++) {
      expect(at(i * 4200 + 100)).toEqual({ step: i, trip: 0 })
      expect(at(i * 4200 + 3300)).toEqual({ step: i, trip: 0 })
    }
  })
  it('runs the last trip back to the first stop and wraps the lap', () => {
    expect(at(9 * 4200 + 3800)).toEqual({ step: 9, trip: 0.5 })
    expect(at(42000)).toEqual({ step: 0, trip: 0 })
    expect(at(42000 * 3 + 4200 * 2 + 10)).toEqual({ step: 2, trip: 0 })
  })
})
