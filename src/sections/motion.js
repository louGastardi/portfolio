// Hover plays a loop. Click opens the YouTube video in a lightbox.
export function initMotion({ reduced }) {
  if (!reduced) {
    document.querySelectorAll('.bento video').forEach(v => {
      const item = v.closest('.bento__item')
      const play = () => v.play().catch(() => {})
      const stop = () => v.pause()
      item.addEventListener('pointerenter', play)
      item.addEventListener('pointerleave', stop)
      item.addEventListener('focus', play)
      item.addEventListener('blur', stop)
    })
  }
  const box = document.querySelector('.lightbox')
  if (!box) return
  const frame = box.querySelector('.lightbox__frame')
  document.querySelectorAll('[data-yt]').forEach(el => el.addEventListener('click', () => {
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(el.dataset.yt)}?autoplay=1&rel=0`
    iframe.title = el.textContent.trim() || 'Video'
    iframe.allow = 'autoplay; encrypted-media; fullscreen'
    iframe.allowFullscreen = true
    frame.replaceChildren(iframe)
    box.showModal()
  }))
  // Esc fires `close` too, so clearing the frame there stops playback either way
  box.addEventListener('close', () => frame.replaceChildren())
  box.querySelector('.lightbox__close').addEventListener('click', () => box.close())
  box.addEventListener('click', e => { if (e.target === box) box.close() })
}
