import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeIndex } from '../lib/progress.js'

gsap.registerPlugin(ScrollTrigger)

// Height of the sticky nav, so the pin starts right below it.
const navHeight = () => {
  const nav = document.querySelector('.nav')
  if (nav) return nav.offsetHeight
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0
}

// Pins the section, moves the playhead with scroll, lights the active year card.
// gsap.matchMedia sets the pin up or tears it down when the viewport or motion preference changes.
export function initTimeline() {
  const cards = [...document.querySelectorAll('.tl__card')]
  const keyframes = [...document.querySelectorAll('.tl__kf')]
  const head = document.querySelector('.tl__playhead')
  const ruler = document.querySelector('.tl__ruler')
  const layers = document.querySelector('.tl__layers')
  if (!cards.length || !head || !ruler || !layers) return
  const setActive = i => cards.forEach((c, n) => c.classList.toggle('is-on', n === i))
  // Playhead spans exactly the ruler plus the layer stack
  const sizeHead = () => { head.style.height = `${ruler.offsetHeight + layers.offsetHeight}px` }

  const mm = gsap.matchMedia()
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    setActive(0)
    sizeHead()
    const st = ScrollTrigger.create({
      trigger: '.tl',
      pin: '.tl__pin',
      // .tl is a flex item (main > section), where GSAP turns pinSpacing off by default
      pinSpacing: true,
      start: () => `top top+=${navHeight()}`,
      end: '+=1600',
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: sizeHead,
      onUpdate: self => {
        const x = self.progress * (ruler.clientWidth - head.offsetWidth)
        head.style.left = `${x}px`
        setActive(activeIndex(self.progress, cards.length))
        keyframes.forEach(k => k.classList.toggle('is-hit', k.offsetLeft <= x))
      }
    })
    return () => {
      st.kill()
      head.style.left = ''
      head.style.height = ''
      keyframes.forEach(k => k.classList.remove('is-hit'))
      cards.forEach(c => c.classList.add('is-on'))
    }
  })
  mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', () => {
    cards.forEach(c => c.classList.add('is-on'))
    sizeHead()
  })
}

// Layout shifts once images, fonts or a language switch land, so pin positions need a fresh measure.
export function refreshOnLayoutChange() {
  let timer
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => ScrollTrigger.refresh(), 100) }
  if (document.readyState === 'complete') refresh()
  else window.addEventListener('load', refresh, { once: true })
  // Lazy images can land after the load event
  document.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', refresh, { once: true }) })
  document.fonts?.ready.then(refresh)
  document.addEventListener('langchange', refresh)
}
