// Endless marquee. One "set" holds every keyword once. A half repeats the set until
// it is wider than the viewport, the track holds two identical halves and slides by -50%,
// so the loop point lands on a copy of the start and nothing jumps.
const SPEED = 80 // px per second

export function initMarquee(track, getItems) {
  const setHtml = () => `<span class="marquee__set">${getItems().map(w => `<em>${w}</em><i>◆</i>`).join('')}</span>`

  const build = () => {
    const set = setHtml()
    track.innerHTML = `<span class="marquee__half">${set}</span>`
    const setW = track.firstElementChild.getBoundingClientRect().width || 1
    const repeats = Math.max(1, Math.ceil(window.innerWidth / setW))
    const half = `<span class="marquee__half">${set.repeat(repeats)}</span>`
    track.innerHTML = half + half
    track.style.setProperty('--marquee-dur', `${(setW * repeats) / SPEED}s`)
  }

  let lastW = window.innerWidth
  let timer = 0
  window.addEventListener('resize', () => {
    // Height-only resizes (mobile URL bar) do not change the width we need
    if (window.innerWidth === lastW) return
    lastW = window.innerWidth
    clearTimeout(timer)
    timer = setTimeout(build, 150)
  })
  document.addEventListener('langchange', build)
  // Anton loads async, its glyph widths change the set width
  document.fonts?.ready.then(build)
  build()
}
