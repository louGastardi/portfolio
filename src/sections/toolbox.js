import { gsap } from 'gsap'

// Boxes drop into the pile when the section scrolls into view, and can be dragged and thrown.
// Physics runs on desktop with motion allowed only. Elsewhere the boxes stay a wrapped list.
// matter-js is loaded on demand so it stays out of the main bundle.
const PHYSICS = '(min-width: 761px) and (prefers-reduced-motion: no-preference)'
// Room for the box shadow (4px) inside the clipped pile
const INSET = 6

export function initToolbox() {
  const pile = document.querySelector('.tools__pile')
  if (!pile) return
  const els = [...pile.querySelectorAll('b')]

  gsap.matchMedia().add(PHYSICS, () => {
    let stop = null
    let cancelled = false
    let resizeTimer

    const run = async () => {
      const { default: Matter } = await import('matter-js')
      if (cancelled) return
      stop?.()
      stop = simulate(Matter, pile, els)
    }

    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { io.disconnect(); run() }
    }, { threshold: 0.4 })
    io.observe(pile)

    // The walls are sized to the pile, so a width change drops the boxes again
    let lastWidth = pile.clientWidth
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (!stop || pile.clientWidth === lastWidth) return
        lastWidth = pile.clientWidth
        run()
      }, 200)
    }
    window.addEventListener('resize', onResize)
    // A language switch changes the box widths, so drop them again with the new sizes
    const onLang = () => { if (stop) run() }
    document.addEventListener('langchange', onLang)

    return () => {
      cancelled = true
      io.disconnect()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('langchange', onLang)
      stop?.()
      stop = null
    }
  })
}

function simulate(Matter, pile, els) {
  const { Engine, Bodies, Body, Composite, Events, Mouse, MouseConstraint, Runner, Sleeping } = Matter

  // Measure in list layout, before the boxes go absolute
  pile.classList.remove('is-physics')
  els.forEach(el => { el.style.transform = '' })
  const sizes = els.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }))
  pile.classList.add('is-physics')
  const W = pile.clientWidth
  // A narrow pile cannot hold every box at the CSS height, the overflow would stack above the clip.
  // Grow the pile so the settled heap (loosely packed, about half air) always fits.
  const area = sizes.reduce((sum, s) => sum + s.w * s.h, 0)
  const need = Math.ceil(area * 1.9 / (W - INSET * 2)) + 40
  pile.style.height = ''
  if (need > pile.clientHeight) pile.style.height = `${need}px`
  const H = pile.clientHeight
  const floor = H - INSET
  const right = W - INSET

  const engine = Engine.create({ enableSleeping: true })
  // Side walls reach far above the pile so boxes dropped or thrown upward fall back in
  const wallH = H * 12
  const walls = [
    Bodies.rectangle(W / 2, floor + 50, W * 2, 100, { isStatic: true }),
    Bodies.rectangle(-50, floor - wallH / 2, 100, wallH, { isStatic: true }),
    Bodies.rectangle(right + 50, floor - wallH / 2, 100, wallH, { isStatic: true })
  ]
  const bodies = els.map((el, i) => {
    const { w, h } = sizes[i]
    const x = w / 2 + Math.random() * Math.max(1, right - w)
    return Bodies.rectangle(x, -h - i * 45, w, h, {
      angle: (Math.random() - 0.5) * 0.4, restitution: 0.2, friction: 0.6, frictionAir: 0.02, sleepThreshold: 40
    })
  })
  Composite.add(engine.world, [...walls, ...bodies])

  // Mouse only: matter's wheel and touch handlers call preventDefault and would block page scroll
  const mouse = Mouse.create(pile)
  pile.removeEventListener('mousewheel', mouse.mousewheel)
  pile.removeEventListener('DOMMouseScroll', mouse.mousewheel)
  pile.removeEventListener('touchmove', mouse.mousemove)
  pile.removeEventListener('touchstart', mouse.mousedown)
  pile.removeEventListener('touchend', mouse.mouseup)
  // Releasing outside the pile still drops the box
  window.addEventListener('mouseup', mouse.mouseup)
  const grab = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } })
  Composite.add(engine.world, grab)

  // A fast throw can tunnel through a wall, so anything that leaves the pile drops back in at the top
  const keepInside = () => {
    bodies.forEach((b, i) => {
      if (b.isSleeping) return
      const { w } = sizes[i]
      const out = b.position.x < -w || b.position.x > right + w || b.position.y > floor + 40
      if (!out) return
      Sleeping.set(b, false)
      Body.setVelocity(b, { x: 0, y: 0 })
      Body.setAngularVelocity(b, 0)
      Body.setPosition(b, { x: Math.min(Math.max(b.position.x, w / 2), right - w / 2), y: -sizes[i].h })
    })
  }

  // Sleeping boxes have not moved, skip them so a settled pile does no DOM writes
  const draw = (all = false) => {
    bodies.forEach((b, i) => {
      if (b.isSleeping && !all) return
      els[i].style.transform = `translate(${b.position.x - sizes[i].w / 2}px, ${b.position.y - sizes[i].h / 2}px) rotate(${b.angle}rad)`
    })
  }
  Events.on(engine, 'afterUpdate', () => { keepInside(); draw() })
  draw(true)

  const runner = Runner.create()
  Runner.run(runner, engine)

  // Pause the simulation while the section is off screen
  const vis = new IntersectionObserver(entries => { runner.enabled = entries[0].isIntersecting })
  vis.observe(pile)

  return () => {
    vis.disconnect()
    Runner.stop(runner)
    Events.off(engine)
    Mouse.clearSourceEvents(mouse)
    pile.removeEventListener('mousemove', mouse.mousemove)
    pile.removeEventListener('mousedown', mouse.mousedown)
    pile.removeEventListener('mouseup', mouse.mouseup)
    window.removeEventListener('mouseup', mouse.mouseup)
    Engine.clear(engine)
    pile.classList.remove('is-physics')
    pile.style.height = ''
    els.forEach(el => { el.style.transform = '' })
  }
}
