import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { id: 'topic', label: 'TOPIC' },
  { id: 'script', label: 'SCRIPT' },
  { id: 'voice', label: 'VOICE' },
  { id: 'frames', label: 'FRAMES' },
  { id: 'edit', label: 'EDIT' },
  { id: 'captions', label: 'CAPTIONS' },
  { id: 'upload', label: 'UPLOAD' },
  { id: 'youtube', label: 'YOUTUBE', dark: true },
  { id: 'analytics', label: 'ANALYTICS' },
  { id: 'comments', label: 'COMMENTS' }
]

// Desktop: row 1 left to right, row 2 right to left, row 3 (analytics, comments) left to right.
// Mobile: one column, so the labels stay readable at phone width.
// The dashed loop runs from COMMENTS back to TOPIC in both.
const LAYOUTS = {
  desktop: {
    viewBox: '0 0 1000 480',
    w: 100,
    h: 44,
    pos: [[70, 45], [290, 45], [510, 45], [730, 45], [730, 225], [510, 225], [290, 225], [70, 225], [290, 405], [510, 405]],
    path: 'M120 67 H 900 V 247 H 120 V 427 H 560',
    loop: 'M610 427 H 960 V 10 H 120 V 45',
    label: { x: 700, y: 462, anchor: 'start' }
  },
  mobile: {
    viewBox: '0 0 360 710',
    w: 160,
    h: 40,
    pos: STEPS.map((_, i) => [100, 20 + i * 68]),
    path: 'M180 40 V 652',
    loop: 'M260 652 H 330 V 6 H 180 V 20',
    label: { x: 330, y: 700, anchor: 'end' }
  }
}

const svgNS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const node = document.createElementNS(svgNS, tag)
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v))
  return node
}

export function initPipelines({ reduced }) {
  const graph = document.querySelector('.pipe__graph')
  if (!graph) return
  const svg = graph.querySelector('svg')
  const g = svg.querySelector('.pipe__nodes')
  const path = svg.querySelector('#pipe-path')
  const loop = svg.querySelector('.pipe__wire--loop')
  const label = svg.querySelector('.pipe__loop-label')
  const dot = svg.querySelector('.pipe__dot')
  const tip = graph.querySelector('.pipe__tip')
  const tipVideo = tip.querySelector('video')
  const tipCaption = tip.querySelector('figcaption')
  // Clip shown on hover. All steps use the Halo loop until per-step clips exist.
  const clip = tipVideo.canPlayType('video/webm') ? './media/biasgap-halo.webm' : './media/biasgap-halo.mp4'

  const showTip = (node, step) => {
    const box = node.getBoundingClientRect()
    const host = graph.getBoundingClientRect()
    tipCaption.textContent = step.label.toLowerCase()
    // Load the clip on first hover only
    if (!tipVideo.getAttribute('src')) tipVideo.src = clip
    tip.hidden = false
    // Keep the card inside the graph so it never widens the page
    const left = Math.min(box.left - host.left + 30, host.width - tip.offsetWidth)
    tip.style.left = `${Math.max(0, left)}px`
    tip.style.top = `${box.bottom - host.top + 10}px`
    if (!reduced) tipVideo.play().catch(() => {})
  }
  const hideTip = () => { tip.hidden = true; tipVideo.pause() }

  const build = layout => {
    svg.setAttribute('viewBox', layout.viewBox)
    path.setAttribute('d', layout.path)
    loop.setAttribute('d', layout.loop)
    label.setAttribute('x', layout.label.x)
    label.setAttribute('y', layout.label.y)
    label.setAttribute('text-anchor', layout.label.anchor)
    g.replaceChildren()
    STEPS.forEach((step, i) => {
      const [x, y] = layout.pos[i]
      const node = el('g', { class: `pipe__node${step.dark ? ' is-dark' : ''}`, 'data-step': step.id })
      node.append(
        el('rect', { class: 'sh', x: x + 6, y: y + 6, width: layout.w, height: layout.h }),
        el('rect', { class: 'bx', x, y, width: layout.w, height: layout.h }),
        Object.assign(el('text', { x: x + 12, y: y + layout.h / 2 + 4 }), { textContent: step.label })
      )
      node.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showTip(node, step) })
      node.addEventListener('pointerleave', hideTip)
      g.appendChild(node)
    })
  }

  const length = () => path.getTotalLength()
  const place = p => {
    const pt = path.getPointAtLength(p * length())
    dot.setAttribute('cx', pt.x)
    dot.setAttribute('cy', pt.y)
  }

  // Rebuilds the graph when the breakpoint flips. Created after the timeline pin, so a
  // ScrollTrigger.refresh (see refreshOnLayoutChange) measures it below the pin spacer.
  const mm = gsap.matchMedia()
  mm.add({ mobile: '(max-width: 760px)', desktop: '(min-width: 761px)' }, ctx => {
    build(ctx.conditions.mobile ? LAYOUTS.mobile : LAYOUTS.desktop)
    hideTip()
    if (reduced) { place(1); return }
    place(0)
    const st = ScrollTrigger.create({
      trigger: graph,
      start: 'top 80%',
      end: 'bottom 30%',
      scrub: true,
      onUpdate: s => place(s.progress),
      onRefresh: s => place(s.progress)
    })
    return () => st.kill()
  })
}
