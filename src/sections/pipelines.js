import { dwellPhase } from '../lib/progress.js'

// Labels come from the dictionary (pipelines.steps.<id>) so they follow the EN/DE switch
const STEPS = [
  { id: 'topic' }, { id: 'script' }, { id: 'voice' }, { id: 'frames' }, { id: 'edit' },
  { id: 'captions' }, { id: 'upload' }, { id: 'youtube', dark: true }, { id: 'analytics' }, { id: 'comments' }
]

// Row 1 left to right, row 2 right to left, row 3 (analytics, comments) left to right.
// The dashed loop runs from COMMENTS back to TOPIC. Phones show the step list instead.
const LAYOUT = {
  w: 100,
  h: 44,
  pos: [[70, 45], [290, 45], [510, 45], [730, 45], [730, 225], [510, 225], [290, 225], [70, 225], [290, 405], [510, 405]]
}

// The dot stops on every node long enough to read its card, then glides to the next one.
// 10 stops x (3.4 s + 0.8 s) = one lap of about 42 s. The last trip runs the dashed loop.
const DWELL = 3400
const TRAVEL = 800
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const svgNS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs) => {
  const node = document.createElementNS(svgNS, tag)
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v))
  return node
}

export function initPipelines({ reduced, t }) {
  const labelOf = id => t(`pipelines.steps.${id}`)
  const graph = document.querySelector('.pipe__graph')
  if (!graph) return
  const svg = graph.querySelector('svg')
  const g = svg.querySelector('.pipe__nodes')
  const path = svg.querySelector('#pipe-path')
  const loop = svg.querySelector('.pipe__wire--loop')
  const dot = svg.querySelector('.pipe__dot')
  const items = [...document.querySelectorAll('.pipe__step')]

  const nodes = STEPS.map((step, i) => {
    const [x, y] = LAYOUT.pos[i]
    const node = el('g', { class: `pipe__node${step.dark ? ' is-dark' : ''}`, 'data-step': step.id })
    node.append(
      el('rect', { class: 'sh', x: x + 6, y: y + 6, width: LAYOUT.w, height: LAYOUT.h }),
      el('rect', { class: 'bx', x, y, width: LAYOUT.w, height: LAYOUT.h }),
      Object.assign(el('text', { x: x + 12, y: y + LAYOUT.h / 2 + 4 }), { textContent: labelOf(step.id) })
    )
    g.appendChild(node)
    return node
  })

  // Highlights one node and shows its print and description. Hover wins over the dot.
  let auto = STEPS.length - 1
  let hover = null
  let shown = -1
  const show = () => {
    const i = hover ?? auto
    if (i === shown) return
    shown = i
    nodes.forEach((n, k) => n.classList.toggle('is-on', k === i))
    items.forEach((li, k) => li.classList.toggle('is-on', k === i))
  }
  nodes.forEach((node, i) => {
    node.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = i; show() } })
    node.addEventListener('pointerleave', () => { hover = null; show() })
  })

  // Language switch: relabel the nodes in place, the list follows data-i18n
  document.addEventListener('langchange', () => {
    nodes.forEach((node, i) => { node.querySelector('text').textContent = labelOf(STEPS[i].id) })
  })

  // Position of every node along the main path, found by sampling it once
  const mainLength = path.getTotalLength?.() || 0
  const loopLength = loop.getTotalLength?.() || 0
  const arcs = LAYOUT.pos.map(([x, y]) => {
    const cx = x + LAYOUT.w / 2
    const cy = y + LAYOUT.h / 2
    let best = 0
    let bestD = Infinity
    for (let d = 0; d <= mainLength; d += 5) {
      const p = path.getPointAtLength(d)
      const dist = (p.x - cx) ** 2 + (p.y - cy) ** 2
      if (dist < bestD) { bestD = dist; best = d }
    }
    return best
  })

  const placeAt = (line, d) => {
    const p = line.getPointAtLength(d)
    dot.setAttribute('cx', p.x)
    dot.setAttribute('cy', p.y)
  }

  // Reduced motion: the dot rests at the end of the main path, hover still works
  if (reduced || !mainLength) {
    if (mainLength) placeAt(path, mainLength)
    show()
    return
  }

  // Walks the dot `trip` (0..1, eased) of the way from node i to the next one.
  // From COMMENTS it finishes the main path, runs the dashed loop and lands on TOPIC.
  const tail = mainLength - arcs[arcs.length - 1]
  const placeTrip = (i, trip) => {
    const e = easeInOut(trip)
    if (i < arcs.length - 1) return placeAt(path, arcs[i] + e * (arcs[i + 1] - arcs[i]))
    let d = e * (tail + loopLength + arcs[0])
    if (d < tail) return placeAt(path, arcs[i] + d)
    d -= tail
    if (d < loopLength) return placeAt(loop, d)
    placeAt(path, d - loopLength)
  }

  // Time based, independent of scroll and mouse. Runs only while the section is on screen,
  // and the clock pauses with it, so the lap always resumes where the viewer left it.
  let clock = 0
  let last = 0
  const frame = now => {
    clock += last ? Math.min(now - last, 100) : 0
    last = now
    const { step, trip } = dwellPhase(clock, STEPS.length, DWELL, TRAVEL)
    placeTrip(step, trip)
    // The card switches when the dot arrives, so each description stays up for the whole stop
    auto = step
    show()
    raf = requestAnimationFrame(frame)
  }
  let raf = 0
  const start = () => { if (!raf) raf = requestAnimationFrame(frame) }
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0 }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(document.querySelector('.pipe__body'))
  } else {
    start()
  }
}
