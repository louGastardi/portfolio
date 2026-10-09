// Cards drift with the mouse, deeper cards move more.
export function initHero({ reduced }) {
  loadCrystal(document.querySelector('.hero__crystal'), { reduced })
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

// three.js is the heaviest dependency, so the crystal loads in its own chunk:
// once the canvas is on screen and the browser is idle after first paint.
function loadCrystal(canvas, opts) {
  if (!canvas) return
  const load = () => import('./crystal.js').then(({ initCrystal }) => initCrystal(canvas, opts))
  const whenIdle = () => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 200))
  if (!('IntersectionObserver' in window)) return whenIdle()
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    io.disconnect()
    whenIdle()
  })
  io.observe(canvas)
}
