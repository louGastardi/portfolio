// Hover plays a loop. Click opens the YouTube video in a lightbox.
export function initMotion({ reduced }) {
  if (!reduced) {
    document.querySelectorAll('.bento video').forEach(v => {
      const item = v.closest('.bento__item')
      const play = () => v.play().catch(() => {})
      const stop = () => v.pause()
      // Mouse only: a tap opens the lightbox, so touch would download the loop for nothing
      item.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') play() })
      item.addEventListener('pointerleave', stop)
      item.addEventListener('focus', () => { if (item.matches(':focus-visible')) play() })
      item.addEventListener('blur', stop)
    })
  }
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
