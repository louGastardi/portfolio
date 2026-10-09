import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initMotion, fillSlot } from '../src/sections/motion.js'

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
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, headers: new Headers() }))
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

  it('keeps the slot media when the reel clip does not exist', async () => {
    document.body.innerHTML = '<div data-slot="reel-1"><img src="still.webp" alt=""></div>'
    const item = document.querySelector('[data-slot]')
    expect(await fillSlot(item)).toBe(null)
    expect(item.querySelector('img')).not.toBe(null)
  })

  it('ignores an html fallback page for a missing clip', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'text/html' }) }))
    document.body.innerHTML = '<div data-slot="reel-1"><img src="still.webp" alt=""></div>'
    expect(await fillSlot(document.querySelector('[data-slot]'))).toBe(null)
  })

  it('swaps in the reel clip once it exists, with the still as poster', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, headers: new Headers({ 'content-type': 'video/mp4' }) }))
    document.body.innerHTML = '<div data-slot="reel-2"><img src="still.webp" alt=""></div>'
    const item = document.querySelector('[data-slot]')
    const video = await fillSlot(item)
    expect(item.querySelector('img')).toBe(null)
    expect(video.muted && video.loop).toBe(true)
    expect(video.poster).toContain('still.webp')
    expect([...video.querySelectorAll('source')].map(s => s.src.split('/').pop())).toEqual(['reel-2.webm', 'reel-2.mp4'])
  })
})
