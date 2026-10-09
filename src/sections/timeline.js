import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { activeIndex } from '../lib/progress.js'

gsap.registerPlugin(ScrollTrigger)

// Pins the section, moves the playhead with scroll, lights the active year card.
export function initTimeline({ reduced, mobile }) {
  const cards = [...document.querySelectorAll('.tl__card')]
  const keyframes = [...document.querySelectorAll('.tl__kf')]
  const head = document.querySelector('.tl__playhead')
  const ruler = document.querySelector('.tl__ruler')
  const setActive = i => cards.forEach((c, n) => c.classList.toggle('is-on', n === i))

  if (reduced || mobile) { cards.forEach(c => c.classList.add('is-on')); return }

  setActive(0)
  ScrollTrigger.create({
    trigger: '.tl',
    pin: '.tl__pin',
    // .tl is a flex container (main > section), where GSAP turns pinSpacing off by default
    pinSpacing: true,
    start: 'top top',
    end: '+=1600',
    scrub: true,
    onUpdate: self => {
      const x = self.progress * ruler.clientWidth
      head.style.left = `${x}px`
      setActive(activeIndex(self.progress, cards.length))
      keyframes.forEach(k => k.classList.toggle('is-hit', k.offsetLeft <= x))
    }
  })
}
