// Bento tiles are looping previews that play like GIFs while on screen. Click opens the
// YouTube video in a lightbox. Reduced motion: nothing plays, the posters stay.
export function initMotion({ reduced }) {
  const bento = document.querySelector('.bento')
  if (bento && !reduced) {
    const watch = autoplayWhileVisible()
    bento.querySelectorAll('video').forEach(watch)
  }
  initLightbox()
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

function initLightbox() {
  const box = document.querySelector('.lightbox')
  if (!box) return
  const frame = box.querySelector('.lightbox__frame')
  let opener = null
  document.querySelectorAll('[data-yt]').forEach(el => el.addEventListener('click', () => {
    opener = el
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(el.dataset.yt)}?autoplay=1&rel=0`
    iframe.title = el.textContent.trim() || 'Video'
    iframe.allow = 'autoplay; encrypted-media; fullscreen'
    iframe.allowFullscreen = true
    frame.replaceChildren(iframe)
    box.showModal()
  }))
  // Esc fires `close` too, so clearing the frame there stops playback either way
  // Focus goes back to the tile that opened it, not every browser does this on its own
  box.addEventListener('close', () => {
    frame.replaceChildren()
    opener?.focus()
    opener = null
  })
  box.querySelector('.lightbox__close').addEventListener('click', () => box.close())
  box.addEventListener('click', e => { if (e.target === box) box.close() })
}
