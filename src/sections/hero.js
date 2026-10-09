import { initCrystal } from './crystal.js'

// Cards drift with the mouse, deeper cards move more.
export function initHero({ reduced }) {
  initCrystal(document.querySelector('.hero__crystal'), { reduced })
  if (reduced) return
  const cards = [...document.querySelectorAll('.hero__card')]
  window.addEventListener('pointermove', e => {
    const dx = e.clientX / window.innerWidth - 0.5
    const dy = e.clientY / window.innerHeight - 0.5
    cards.forEach(c => {
      const d = Number(c.dataset.depth)
      c.style.translate = `${dx * d}px ${dy * d}px`
    })
  })
}
