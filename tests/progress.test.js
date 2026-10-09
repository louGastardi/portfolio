import { describe, it, expect } from 'vitest'
import { clamp, activeIndex, loopPhase, stepAt } from '../src/lib/progress.js'

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

describe('loopPhase', () => {
  it('runs 0..1 over one period and wraps', () => {
    expect(loopPhase(0, 10000)).toBe(0)
    expect(loopPhase(2500, 10000)).toBe(0.25)
    expect(loopPhase(12500, 10000)).toBe(0.25)
    expect(loopPhase(-2500, 10000)).toBe(0.75)
  })
})

describe('stepAt', () => {
  const arcs = [0, 220, 440, 660]
  it('is the last step the dot has reached', () => {
    expect(stepAt(0, arcs)).toBe(0)
    expect(stepAt(219, arcs)).toBe(0)
    expect(stepAt(220, arcs)).toBe(1)
    expect(stepAt(500, arcs)).toBe(2)
  })
  it('stays on the last step past the end', () => {
    expect(stepAt(9999, arcs)).toBe(3)
  })
})
