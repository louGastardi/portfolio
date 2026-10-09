import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initTutorials } from '../src/sections/tutorials.js'

let observed
class FakeIO {
  constructor(cb) { this.cb = cb; observed = this }
  observe(el) { this.el = el }
  fire(isIntersecting) { this.cb([{ target: this.el, isIntersecting }]) }
}

const setup = () => {
  document.body.innerHTML = `<div class="script__tut"><video muted loop playsinline preload="none"></video>
    <button class="script__play" type="button" aria-pressed="false" hidden></button></div>`
  const video = document.querySelector('video')
  video.play = vi.fn(() => Promise.resolve())
  video.pause = vi.fn()
  return { video, button: document.querySelector('.script__play') }
}

describe('tutorial videos', () => {
  beforeEach(() => { window.IntersectionObserver = FakeIO })

  it('plays while visible and pauses when it leaves the screen', () => {
    const { video, button } = setup()
    initTutorials({ reduced: false })
    expect(button.hidden).toBe(true)
    observed.fire(true)
    expect(video.play).toHaveBeenCalledTimes(1)
    observed.fire(false)
    expect(video.pause).toHaveBeenCalled()
  })

  it('never autoplays with reduced motion, the button starts it', () => {
    const { video, button } = setup()
    initTutorials({ reduced: true })
    expect(button.hidden).toBe(false)
    observed.fire(true)
    expect(video.play).not.toHaveBeenCalled()
    button.click()
    expect(video.play).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    button.click()
    expect(video.pause).toHaveBeenCalled()
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })
})
