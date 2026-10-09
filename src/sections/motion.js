// Bento tiles are looping previews that play like GIFs while on screen and pause off screen.
// Nothing to click. Reduced motion: nothing plays, the posters stay.
export function initMotion({ reduced }) {
  const bento = document.querySelector('.bento')
  if (!bento || reduced) return
  const watch = autoplayWhileVisible()
  bento.querySelectorAll('video').forEach(watch)
}

// One observer for every tile: play when it scrolls in, pause when it leaves
function autoplayWhileVisible() {
  if (!('IntersectionObserver' in window)) return () => {}
  const io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play()?.catch(() => {})
    else target.pause()
  }), { rootMargin: '100px 0px' })
  return video => io.observe(video)
}
