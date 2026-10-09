import { initCrystal } from './crystal.js'

// Cards drift with the mouse, deeper cards move more.
export function initHero({ reduced }) {
  initCrystal(document.querySelector('.hero__crystal'), { reduced })
  if (reduced) {
    document.querySelectorAll('.hero video').forEach(v => {
      v.removeAttribute('autoplay')
      v.autoplay = false
      v.pause()
      v.currentTime = 0
    })
    return
  }
  const cards = [...document.querySelectorAll('.hero__card')]
  let dx = 0
  let dy = 0
  let queued = false
  const write = () => {
    queued = false
    cards.forEach(c => {
      const d = Number(c.dataset.depth)
      c.style.translate = `${dx * d}px ${dy * d}px`
    })
  }
  window.addEventListener('pointermove', e => {
    dx = e.clientX / window.innerWidth - 0.5
    dy = e.clientY / window.innerHeight - 0.5
    if (!queued) { queued = true; requestAnimationFrame(write) }
  })
}
