import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initMotion } from '../src/sections/motion.js'

let observer
class FakeIO {
  constructor(cb) { this.cb = cb; this.els = []; observer = this }
  observe(el) { this.els.push(el) }
  fire(isIntersecting) { this.cb(this.els.map(target => ({ target, isIntersecting }))) }
}

const setup = () => {
  document.body.innerHTML = `<div class="bento">
    <button class="bento__item" data-yt="x"><video muted loop playsinline preload="none"></video><span>Loop</span></button>
  </div>`
  const video = document.querySelector('video')
  video.play = vi.fn(() => Promise.resolve())
  video.pause = vi.fn()
  return video
}

describe('motion bento', () => {
  beforeEach(() => {
    window.IntersectionObserver = FakeIO
    observer = null
  })

  it('plays the loops while on screen and pauses them off screen', () => {
    const video = setup()
    initMotion({ reduced: false })
    observer.fire(true)
    expect(video.play).toHaveBeenCalledTimes(1)
    observer.fire(false)
    expect(video.pause).toHaveBeenCalled()
  })

  it('never autoplays with reduced motion', () => {
    const video = setup()
    initMotion({ reduced: true })
    expect(observer).toBe(null)
    expect(video.play).not.toHaveBeenCalled()
  })
})
