// The cards stay put, only the crystal follows the mouse (see crystal.js).
export function initHero({ reduced }) {
  loadCrystal(document.querySelector('.hero__crystal'), { reduced })
  if (reduced) {
    document.querySelectorAll('.hero video').forEach(v => {
      v.removeAttribute('autoplay')
      v.autoplay = false
      v.pause()
      v.currentTime = 0
    })
  }
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
