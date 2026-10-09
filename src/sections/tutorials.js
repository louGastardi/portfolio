// Script tutorials: play only while the card is on screen. With reduced motion
// nothing autoplays; the poster stays and a play button starts the clip.
export function initTutorials({ reduced }) {
  const cards = [...document.querySelectorAll('.script__tut')]
  if (!cards.length) return

  const visible = new Map()
  // In reduced-motion mode a clip only runs after the viewer pressed play
  const wanted = video => !reduced || video.dataset.userPlay === '1'

  const sync = video => {
    if (visible.get(video) && wanted(video)) video.play().catch(() => {})
    else video.pause()
  }

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(e => {
        const video = e.target.querySelector('video')
        visible.set(video, e.isIntersecting)
        sync(video)
      })
    }, { threshold: 0.35 })
    : null

  cards.forEach(card => {
    const video = card.querySelector('video')
    const button = card.querySelector('.script__play')
    if (!video) return
    if (reduced && button) {
      button.hidden = false
      const setState = playing => {
        button.setAttribute('aria-pressed', String(playing))
        card.classList.toggle('is-playing', playing)
      }
      button.addEventListener('click', () => {
        const start = video.dataset.userPlay !== '1'
        video.dataset.userPlay = start ? '1' : '0'
        setState(start)
        if (start) video.play().catch(() => {})
        else video.pause()
      })
    }
    if (io) io.observe(card)
    // No observer support: autoplay only when motion is allowed
    else if (!reduced) { visible.set(video, true); sync(video) }
  })
}
