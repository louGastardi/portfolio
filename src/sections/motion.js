// Bento tiles are looping previews that play like GIFs while on screen. Click opens the
// YouTube video in a lightbox. Reduced motion: nothing plays, the posters stay.
export function initMotion({ reduced }) {
  const bento = document.querySelector('.bento')
  if (bento) {
    const watch = reduced ? () => {} : autoplayWhileVisible()
    bento.querySelectorAll('.bento video').forEach(watch)
    // Reel slots switch to their clip once media/reel-N.mp4 exists, then play like the rest
    bento.querySelectorAll('[data-slot]').forEach(item => fillSlot(item).then(v => v && watch(v)))
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

// Looks for media/<slot>.mp4 (and .webm, -poster.jpg). Missing file: the tile keeps its current media.
export async function fillSlot(item) {
  const name = item.dataset.slot
  const base = new URL(`./media/${name}`, document.baseURI).href
  try {
    const res = await fetch(`${base}.mp4`, { method: 'HEAD' })
    // A dev server can answer unknown paths with index.html, so check it really is a video
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('video/')) return null
  } catch {
    return null
  }
  const old = item.querySelector('img, video')
  if (!old) return null
  const video = document.createElement('video')
  video.muted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'none'
  video.setAttribute('aria-hidden', 'true')
  // The current still (or loop poster) stays as the poster until a reel-N-poster.jpg is added
  video.poster = old.tagName === 'IMG' ? old.currentSrc || old.src : old.poster
  const fallbackPoster = video.poster
  const poster = new Image()
  poster.onload = () => { video.poster = poster.src }
  poster.onerror = () => { video.poster = fallbackPoster }
  poster.src = `${base}-poster.jpg`
  for (const [ext, type] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) {
    const source = document.createElement('source')
    source.src = `${base}.${ext}`
    source.type = type
    video.append(source)
  }
  old.replaceWith(video)
  return video
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
