# Lou Gastardi Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the one-page scroll portfolio described in `docs/superpowers/specs/2026-10-09-portfolio-design.md`.

**Architecture:** Static Vite site. `index.html` holds all section markup with `data-i18n` keys. Each section has its own CSS file and its own JS module that exports `init()`. `main.js` wires i18n, reduced-motion detection and section inits. Pure logic (i18n lookup, timeline progress mapping, pipeline path math) lives in small modules with Vitest tests. Visual behavior is verified in the browser at each task.

**Tech Stack:** Vite 5, vanilla JS (ES modules), GSAP 3 + ScrollTrigger, Three.js r160+, Matter.js, Vitest, ffmpeg/cwebp (asset prep), GitHub Pages via GitHub Actions.

**Visual reference:** `.superpowers/brainstorm/98262-1791471131/content/page-mockup.html`. Match its layout, sizes and colors. Ignore the yellow `.note` boxes (they are design notes).

**Copy rules:** English and German. No em dashes, no semicolons, few adjectives. Role line is "Motion Designer / Creative Technologist" (no "Senior").

**Out of this plan (separate plans):** English UI for the two After Effects scripts, Remotion tutorial videos. This plan ships script cards with a poster image in the tutorial box and a disabled Download button labeled "Soon".

---

## File Structure

```
Portfolio/
  package.json
  vite.config.js
  index.html                      all sections, data-i18n keys
  public/
    media/                        compressed images + loops (Task 4)
    cv/                           CV PDFs (Task 12)
  scripts/
    prep-media.sh                 converts assets/ -> public/media/
  src/
    main.js                       boot: i18n, reduced motion, section inits
    lib/
      prefs.js                    reducedMotion(), isMobile()
      progress.js                 activeIndex(progress, count), clamp()
    i18n/
      i18n.js                     t(key), setLang(lang), applyTranslations(root)
      en.json
      de.json
    sections/
      nav.js                      language toggle
      hero.js                     card drift
      crystal.js                  Three.js keyframe crystal
      timeline.js                 pinned AE timeline
      motion.js                   bento hover play + lightbox
      web.js                      device autoscroll
      pipelines.js                node graph dot + hover clips
      toolbox.js                  Matter.js pile
    styles/
      tokens.css
      base.css
      nav.css hero.css marquee.css about.css timeline.css
      motion.css web.css pipelines.css automation.css toolbox.css contact.css
  tests/
    i18n.test.js
    progress.test.js
  .github/workflows/deploy.yml
```

---

### Task 1: Scaffold Vite project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "lou-portfolio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "three": "^0.160.0",
    "matter-js": "^0.19.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'

// base matches the GitHub Pages repo path: https://lougastardi.github.io/portfolio/
export default defineConfig({
  base: '/portfolio/',
  test: { environment: 'jsdom' }
})
```

- [ ] **Step 3: Create minimal `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lou Gastardi · Motion Designer / Creative Technologist</title>
  <meta name="description" content="Motion design, AI video pipelines and creative technology. Berlin.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
  <main id="app"></main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create `src/main.js`**

```js
console.log('portfolio boot')
```

- [ ] **Step 5: Install and run**

Run: `cd ~/Desktop/Lou/Portfolio && npm install && npm run build`
Expected: build succeeds, `dist/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src/main.js
git commit -m "chore: scaffold Vite project"
```

---

### Task 2: Design tokens, base styles, nav

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/nav.css`
- Modify: `index.html` (nav markup), `src/main.js` (CSS imports)

- [ ] **Step 1: `src/styles/tokens.css`**

```css
:root {
  --ink: #232323;
  --lime: #91C11E;
  --green: #067A46;
  --paper: #ffffff;
  --soft: #f4f4f1;
  --font-display: 'Anton', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --border: 2px solid var(--ink);
  --shadow: 7px 7px 0 var(--lime);
  --shadow-sm: 4px 4px 0 var(--lime);
  --gutter: clamp(20px, 4.5vw, 50px);
}
```

- [ ] **Step 2: `src/styles/base.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-body); color: var(--ink); background: var(--paper); overflow-x: hidden; }
img, video { display: block; max-width: 100%; }
a { color: inherit; }
section { position: relative; }
/* Every section fills the screen, content centered vertically */
main > section { min-height: 100vh; min-height: 100svh; display: flex; flex-direction: column; justify-content: center; }
.disp { font-family: var(--font-display); text-transform: uppercase; line-height: .86; letter-spacing: .5px; font-weight: 400; }
.mono { font-family: var(--font-mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
.card { border: var(--border); box-shadow: var(--shadow); background: var(--paper); }
.lime { color: var(--lime); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
```

- [ ] **Step 3: `src/styles/nav.css`**

```css
.nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 14px var(--gutter); background: var(--paper); border-bottom: var(--border); }
.nav__logo { font: 700 20px var(--font-body); text-decoration: none; }
.nav__logo span { background: var(--lime); padding: 0 4px; }
.nav__links { display: flex; gap: 22px; }
.nav__links a { text-decoration: none; }
.nav__links a:hover { color: var(--green); }
.nav__lang button { font: inherit; background: none; border: 0; padding: 3px 6px; cursor: pointer; }
.nav__lang button[aria-pressed="true"] { background: var(--ink); color: #fff; }
@media (max-width: 760px) { .nav__links { display: none; } }
```

- [ ] **Step 4: Replace `<main id="app"></main>` in `index.html` with the nav plus empty section anchors**

```html
<header class="nav">
  <a class="nav__logo" href="#top"><span>LG</span></a>
  <nav class="nav__links mono" aria-label="Sections">
    <a href="#about" data-i18n="nav.about">About</a>
    <a href="#timeline" data-i18n="nav.timeline">Timeline</a>
    <a href="#motion" data-i18n="nav.motion">Motion</a>
    <a href="#web" data-i18n="nav.web">Web</a>
    <a href="#pipelines" data-i18n="nav.pipelines">Pipelines</a>
    <a href="#contact" data-i18n="nav.contact">Contact</a>
  </nav>
  <div class="nav__lang mono" role="group" aria-label="Language">
    <button data-lang="en" aria-pressed="true">EN</button>
    <button data-lang="de" aria-pressed="false">DE</button>
  </div>
</header>
<main id="top"></main>
```

- [ ] **Step 5: Import CSS in `src/main.js`**

```js
import './styles/tokens.css'
import './styles/base.css'
import './styles/nav.css'
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`, open the printed URL.
Expected: sticky nav with lime `LG`, 6 links, EN highlighted.

- [ ] **Step 7: Commit**

```bash
git add index.html src/main.js src/styles
git commit -m "feat: tokens, base styles and nav"
```

---

### Task 3: i18n module (TDD)

**Files:**
- Create: `src/i18n/i18n.js`, `src/i18n/en.json`, `src/i18n/de.json`, `src/sections/nav.js`, `tests/i18n.test.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write failing test `tests/i18n.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { createI18n } from '../src/i18n/i18n.js'

const dicts = {
  en: { nav: { about: 'About' }, hero: { role: 'Motion Designer' } },
  de: { nav: { about: 'Über mich' } }
}

describe('i18n', () => {
  let i18n
  beforeEach(() => { i18n = createI18n(dicts, 'en') })

  it('looks up nested keys', () => {
    expect(i18n.t('hero.role')).toBe('Motion Designer')
  })

  it('switches language', () => {
    i18n.setLang('de')
    expect(i18n.t('nav.about')).toBe('Über mich')
  })

  it('falls back to English when a key is missing', () => {
    i18n.setLang('de')
    expect(i18n.t('hero.role')).toBe('Motion Designer')
  })

  it('returns the key when nothing matches', () => {
    expect(i18n.t('nope.missing')).toBe('nope.missing')
  })

  it('applies translations to elements with data-i18n', () => {
    document.body.innerHTML = '<a data-i18n="nav.about">x</a>'
    i18n.setLang('de')
    i18n.apply(document.body)
    expect(document.querySelector('a').textContent).toBe('Über mich')
    expect(document.documentElement.lang).toBe('de')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- tests/i18n.test.js`
Expected: FAIL, cannot find module `../src/i18n/i18n.js`.

- [ ] **Step 3: Implement `src/i18n/i18n.js`**

```js
// Tiny dictionary-based i18n. Keys are dot paths into nested JSON.
function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && part in node ? node[part] : undefined), dict)
}

export function createI18n(dicts, initial = 'en') {
  let lang = initial
  return {
    get lang() { return lang },
    setLang(next) { if (dicts[next]) lang = next },
    t(key) {
      const value = lookup(dicts[lang], key) ?? lookup(dicts.en, key)
      return typeof value === 'string' ? value : key
    },
    apply(root = document) {
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n) })
      root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = this.t(el.dataset.i18nHtml) })
      document.documentElement.lang = lang
    }
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- tests/i18n.test.js`
Expected: 5 passed.

- [ ] **Step 5: Create `src/i18n/en.json`**

```json
{
  "nav": { "about": "About", "timeline": "Timeline", "motion": "Motion", "web": "Web", "pipelines": "Pipelines", "contact": "Contact" },
  "hero": { "role": "Motion Designer / Creative Technologist · Berlin" },
  "marquee": ["Motion design", "After Effects", "Cinema 4D", "AI video", "Automation", "Web", "Stop motion"],
  "about": {
    "title": "About me:",
    "bio": "I animate the parts that need a human eye, and build the systems that handle the rest. I started with paper and a camera, making stop motion. Now I connect motion, code and AI.",
    "based": "Based in", "basedValue": "Berlin, Germany",
    "doing": "Doing", "doingValue": "Motion · Creative tech · AI pipelines",
    "speaks": "Speaks", "speaksValue": "PT · EN · DE · ES"
  },
  "timeline": {
    "title": "From keyframes…",
    "y2010": "Bauhaus Weimar. Paper, clay and a camera.",
    "y2014": "Camera Medica. Motion for hundreds of clients.",
    "y2022": "Learned to code. ONE and Ironhack.",
    "y2024": "eduBITES. Courses, motion and web.",
    "y2026": "Creative Technologist. Pipelines."
  },
  "web": {
    "title": "Built for the web",
    "edubites": "eduBITES · AI Skill Assessment. Design, code and upkeep.",
    "rpg": "JS · OOP game",
    "decrypter": "HTML · CSS · JS",
    "visit": "Visit"
  },
  "pipelines": {
    "title": "…to pipelines.",
    "flow": "The Bias Gap · automated YouTube channel",
    "hover": "Hover a step to see it run",
    "loop": "insights feed the next topic",
    "aa": "A ScriptUI panel for After Effects. One click adds entrances, exits, elastic scale, fades and subtle camera moves to any layer. Built with expressions, so animations adapt when you trim. Also sequences, precomposes and copies the current frame.",
    "srt": "Load a voiceover transcript (.srt) and a cut sheet, and it places every image layer where its line is spoken. An hour of manual timing becomes one click.",
    "meta": ".jsx · AE 2024+ · free",
    "download": "Download",
    "soon": "Soon"
  },
  "toolbox": { "title": "Toolbox" },
  "contact": { "title": "Let's make things", "move": "move.", "cvEn": "CV · English", "cvDe": "Lebenslauf · Deutsch", "reel": "Showreel" }
}
```

- [ ] **Step 6: Create `src/i18n/de.json`**

```json
{
  "nav": { "about": "Über mich", "timeline": "Werdegang", "motion": "Motion", "web": "Web", "pipelines": "Pipelines", "contact": "Kontakt" },
  "hero": { "role": "Motion Designerin / Creative Technologist · Berlin" },
  "marquee": ["Motion Design", "After Effects", "Cinema 4D", "KI-Video", "Automatisierung", "Web", "Stop Motion"],
  "about": {
    "title": "Über mich:",
    "bio": "Ich animiere die Teile, die ein menschliches Auge brauchen, und baue Systeme für den Rest. Angefangen habe ich mit Papier und einer Kamera, mit Stop Motion. Heute verbinde ich Motion, Code und KI.",
    "based": "Wohnort", "basedValue": "Berlin",
    "doing": "Fokus", "doingValue": "Motion · Creative Tech · KI-Pipelines",
    "speaks": "Sprachen", "speaksValue": "PT · EN · DE · ES"
  },
  "timeline": {
    "title": "Von Keyframes…",
    "y2010": "Bauhaus Weimar. Papier, Knete und eine Kamera.",
    "y2014": "Camera Medica. Motion für Hunderte Kunden.",
    "y2022": "Programmieren gelernt. ONE und Ironhack.",
    "y2024": "eduBITES. Kurse, Motion und Web.",
    "y2026": "Creative Technologist. Pipelines."
  },
  "web": {
    "title": "Gebaut fürs Web",
    "edubites": "eduBITES · AI Skill Assessment. Design, Code und Betreuung.",
    "rpg": "JS · OOP-Spiel",
    "decrypter": "HTML · CSS · JS",
    "visit": "Ansehen"
  },
  "pipelines": {
    "title": "…zu Pipelines.",
    "flow": "The Bias Gap · automatisierter YouTube-Kanal",
    "hover": "Über einen Schritt fahren, um ihn laufen zu sehen",
    "loop": "Erkenntnisse speisen das nächste Thema",
    "aa": "Ein ScriptUI-Panel für After Effects. Ein Klick fügt jeder Ebene Ein- und Ausgänge, elastische Skalierung, Fades und leichte Kamerabewegungen hinzu. Mit Expressions gebaut, die Animationen passen sich beim Trimmen an. Sequenziert, precomposed und kopiert außerdem den aktuellen Frame.",
    "srt": "Lädt ein Voiceover-Transkript (.srt) und ein Cut Sheet und setzt jede Bildebene genau dorthin, wo ihr Satz gesprochen wird. Aus einer Stunde Timing wird ein Klick.",
    "meta": ".jsx · AE 2024+ · kostenlos",
    "download": "Download",
    "soon": "Bald"
  },
  "toolbox": { "title": "Werkzeuge" },
  "contact": { "title": "Bringen wir Dinge in", "move": "Bewegung.", "cvEn": "CV · English", "cvDe": "Lebenslauf · Deutsch", "reel": "Showreel" }
}
```

- [ ] **Step 7: Create `src/sections/nav.js`**

```js
// Wires the EN/DE buttons. Remembers the choice per visitor.
export function initNav(i18n) {
  const buttons = document.querySelectorAll('.nav__lang button')
  const set = lang => {
    i18n.setLang(lang)
    i18n.apply(document)
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)))
    try { localStorage.setItem('lang', lang) } catch {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }))
  }
  buttons.forEach(b => b.addEventListener('click', () => set(b.dataset.lang)))
  let saved = null
  try { saved = localStorage.getItem('lang') } catch {}
  const browser = navigator.language?.startsWith('de') ? 'de' : 'en'
  set(saved || browser)
}
```

- [ ] **Step 8: Wire in `src/main.js`**

```js
import './styles/tokens.css'
import './styles/base.css'
import './styles/nav.css'
import en from './i18n/en.json'
import de from './i18n/de.json'
import { createI18n } from './i18n/i18n.js'
import { initNav } from './sections/nav.js'

const i18n = createI18n({ en, de }, 'en')
initNav(i18n)
```

- [ ] **Step 9: Verify in browser**

Click DE. Expected: nav links switch to "Über mich, Werdegang, Motion, Web, Pipelines, Kontakt", `<html lang="de">`. Reload keeps DE.

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "feat: EN/DE i18n with toggle"
```

---

### Task 4: Media prep

**Files:**
- Create: `scripts/prep-media.sh`
- Output: `public/media/*`

- [ ] **Step 1: Create `scripts/prep-media.sh`**

```bash
#!/usr/bin/env bash
# Converts source assets in assets/ into web-ready files in public/media/.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets
OUT=public/media
mkdir -p "$OUT"

img() { cwebp -quiet -q "${3:-80}" -resize "$2" 0 "$SRC/$1" -o "$OUT/${1%.*}.webp"; }
img lou_portrait.jpg 900
img edubites_ai_skills_desktop.jpg 1200 75
img edubites_ai_skills_mobile.jpg 420 75
img rpg_game.png 800
img encryptor.png 800
img eraserboy_frame.jpg 1200
img eraserboy_thumb.jpg 1200
img curioso_caju.png 900
for n in 24 28 54; do img "biasgap_cover_$n.jpg" 600; done

loop() { # name src
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libvpx-vp9 -crf 36 -b:v 0 "$OUT/$1.webm"
  ffmpeg -v error -y -i "$SRC/$2" -frames:v 1 -q:v 3 "$OUT/$1-poster.jpg"
}
loop curioso-capybara curioso_loop_capivara.mp4
loop biasgap-halo biasgap_loop_halo.mp4
loop biasgap-diderot biasgap_loop_diderot.mp4
echo "media ready:"; ls -1 "$OUT"
```

- [ ] **Step 2: Run it**

Run: `brew list webp >/dev/null 2>&1 || brew install webp; chmod +x scripts/prep-media.sh && ./scripts/prep-media.sh`
Expected: lists 12 `.webp`, 3 `.mp4`, 3 `.webm`, 3 `-poster.jpg`.

- [ ] **Step 3: Check total size**

Run: `du -sh public/media`
Expected: under 6 MB.

- [ ] **Step 4: Commit**

```bash
git add scripts/prep-media.sh public/media
git commit -m "chore: web-ready media"
```

---

### Task 5: Hero with keyframe crystal and drifting cards

**Files:**
- Create: `src/styles/hero.css`, `src/sections/hero.js`, `src/sections/crystal.js`, `src/lib/prefs.js`
- Modify: `index.html` (inside `<main id="top">`), `src/main.js`

- [ ] **Step 1: `src/lib/prefs.js`**

```js
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isMobile = () => window.matchMedia('(max-width: 760px)').matches
```

- [ ] **Step 2: Hero markup, add as first child of `<main id="top">`**

```html
<section class="hero" id="hero">
  <h1 class="hero__name disp"><span>Lou</span><span class="hero__l2">Gastardi</span></h1>
  <canvas class="hero__crystal" aria-hidden="true"></canvas>
  <figure class="hero__card hero__card--1 card" data-depth="18">
    <video src="./media/curioso-capybara.mp4" poster="./media/curioso-capybara-poster.jpg" muted loop playsinline autoplay></video>
    <figcaption class="mono">Mundo Curioso</figcaption>
  </figure>
  <figure class="hero__card hero__card--2 card" data-depth="10">
    <img src="./media/edubites_ai_skills_desktop.webp" alt="eduBITES AI Skill Assessment">
    <figcaption class="mono">eduBITES</figcaption>
  </figure>
  <figure class="hero__card hero__card--3 card" data-depth="24">
    <img src="./media/biasgap_cover_54.webp" alt="The Bias Gap Short cover">
    <figcaption class="mono">The Bias Gap</figcaption>
  </figure>
  <p class="hero__role mono" data-i18n="hero.role">Motion Designer / Creative Technologist · Berlin</p>
</section>
```

Note: paths start with `./media/` because Vite copies `public/` to the site root and `base` is `/portfolio/`.

- [ ] **Step 3: `src/styles/hero.css`**

```css
.hero { height: min(100vh, 760px); min-height: 560px; overflow: hidden; }
.hero__name { position: absolute; left: -1.2vw; top: 4vh; font-size: clamp(120px, 22vw, 300px); }
.hero__name span { display: block; }
.hero__l2 { margin-left: 8vw; }
.hero__crystal { position: absolute; left: 42%; top: 6%; width: min(26vw, 280px); height: min(26vw, 280px); }
.hero__card { position: absolute; overflow: hidden; will-change: transform; }
.hero__card img, .hero__card video { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.hero__card figcaption { position: absolute; left: 8px; bottom: 7px; background: var(--ink); color: #fff; padding: 2px 5px; }
.hero__card--1 { right: 6%; top: 9%; width: 230px; height: 150px; rotate: 6deg; }
.hero__card--2 { right: 22%; top: 40%; width: 210px; height: 135px; rotate: -8deg; }
.hero__card--3 { right: 4%; top: 46%; width: 170px; height: 225px; rotate: 3deg; }
.hero__role { position: absolute; left: var(--gutter); bottom: 44px; font-size: 13px; }
@media (max-width: 760px) {
  .hero { height: auto; padding: 40px var(--gutter) 320px; }
  .hero__name { position: static; font-size: 30vw; }
  .hero__crystal { left: auto; right: 4%; top: 30%; width: 38vw; height: 38vw; }
  .hero__card--1 { right: auto; left: 6%; top: auto; bottom: 120px; width: 46vw; height: 30vw; }
  .hero__card--2 { display: none; }
  .hero__card--3 { right: 6%; top: auto; bottom: 60px; width: 34vw; height: 44vw; }
  .hero__role { bottom: 20px; }
}
```

- [ ] **Step 4: `src/sections/crystal.js`**

```js
import * as THREE from 'three'

// The AE keyframe diamond as a 3D octahedron. Idle spin, follows the mouse.
// Returns { mesh, renderer } so the timeline can reuse the shape later.
export function initCrystal(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.z = 5

  const geo = new THREE.OctahedronGeometry(1.2, 0)
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x91c11e, transparent: true, opacity: 0.35 }))
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x232323 }))
  const mesh = new THREE.Group()
  mesh.add(fill, edges)
  scene.add(mesh)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const target = { x: 0, y: 0 }
  window.addEventListener('pointermove', e => {
    target.y = (e.clientX / window.innerWidth - 0.5) * 1.6
    target.x = (e.clientY / window.innerHeight - 0.5) * 1.2
  })

  const tick = () => {
    if (!reduced) mesh.rotation.y += 0.004
    mesh.rotation.x += (target.x - mesh.rotation.x) * 0.06
    mesh.rotation.y += (target.y - (mesh.rotation.y % (Math.PI * 2))) * 0.01
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  tick()
  return { mesh, renderer }
}
```

- [ ] **Step 5: `src/sections/hero.js`**

```js
import { initCrystal } from './crystal.js'

// Cards drift with the mouse, deeper cards move more.
export function initHero({ reduced }) {
  initCrystal(document.querySelector('.hero__crystal'), { reduced })
  if (reduced) return
  const cards = [...document.querySelectorAll('.hero__card')]
  window.addEventListener('pointermove', e => {
    const dx = e.clientX / window.innerWidth - 0.5
    const dy = e.clientY / window.innerHeight - 0.5
    cards.forEach(c => {
      const d = Number(c.dataset.depth)
      c.style.translate = `${dx * d}px ${dy * d}px`
    })
  })
}
```

- [ ] **Step 6: Wire in `src/main.js` (append)**

```js
import './styles/hero.css'
import { reducedMotion } from './lib/prefs.js'
import { initHero } from './sections/hero.js'

const reduced = reducedMotion()
initHero({ reduced })
```

- [ ] **Step 7: Verify in browser**

Expected: "LOU / GASTARDI" bleeding left, lime/black octahedron spinning and tilting with the mouse, 3 tilted cards with lime shadows drifting, capybara video looping, role line bottom left. Compare with the mockup hero.

- [ ] **Step 8: Commit**

```bash
git add index.html src
git commit -m "feat: hero with 3D keyframe crystal"
```

---

### Task 6: Marquee and About

**Files:**
- Create: `src/styles/marquee.css`, `src/styles/about.css`
- Modify: `index.html` (after hero), `src/main.js`

- [ ] **Step 1: Markup after the hero section**

```html
<div class="marquee" aria-hidden="true"><div class="marquee__run disp"></div></div>

<section class="about" id="about">
  <div class="about__l">
    <h2 class="about__title disp"><span data-i18n="about.title">About me:</span></h2>
    <p class="about__bio" data-i18n="about.bio"></p>
    <dl class="about__facts">
      <div><dt class="mono" data-i18n="about.based">Based in</dt><dd data-i18n="about.basedValue"></dd></div>
      <div><dt class="mono" data-i18n="about.doing">Doing</dt><dd data-i18n="about.doingValue"></dd></div>
      <div><dt class="mono" data-i18n="about.speaks">Speaks</dt><dd data-i18n="about.speaksValue"></dd></div>
    </dl>
  </div>
  <div class="about__r"><img class="about__photo" src="./media/lou_portrait.webp" alt="Lou Gastardi"></div>
</section>
```

- [ ] **Step 2: `src/styles/marquee.css`**

```css
.marquee { background: var(--lime); border-block: var(--border); overflow: hidden; white-space: nowrap; padding: 12px 0; }
.marquee__run { display: inline-block; font-size: 26px; animation: marquee 22s linear infinite; }
.marquee__run em { font-style: normal; margin: 0 22px; }
@keyframes marquee { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .marquee__run { animation: none; } }
```

- [ ] **Step 3: `src/styles/about.css`**

```css
main > section.about { display: grid; grid-template-columns: 1fr minmax(320px, 470px); align-items: stretch; }
.about__l { align-self: center; }
.about__l { padding: 60px var(--gutter); }
.about__title { font-size: clamp(64px, 10vw, 110px); }
.about__title span { box-shadow: inset 0 -14px 0 var(--lime); }
.about__bio { font-size: 19px; line-height: 1.45; margin: 34px 0 30px; max-width: 470px; }
.about__facts div { display: grid; grid-template-columns: 120px 1fr; border-bottom: 1.5px solid var(--ink); padding: 9px 0; font-size: 18px; }
.about__r { background: var(--ink); display: flex; align-items: center; justify-content: center; padding: 40px; }
.about__photo { width: 330px; aspect-ratio: 330 / 420; object-fit: cover; border: 2px solid #fff; filter: grayscale(1) contrast(1.1); }
@media (max-width: 760px) { .about { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Fill the marquee from i18n in `src/main.js` (append), and refill on language change**

```js
import './styles/marquee.css'
import './styles/about.css'

const fillMarquee = () => {
  const items = (i18n.lang === 'de' ? de : en).marquee
  const run = items.map(w => `<em>${w}</em>◆`).join('')
  document.querySelector('.marquee__run').innerHTML = run + run
}
fillMarquee()
document.addEventListener('langchange', fillMarquee)
```

- [ ] **Step 5: Verify in browser**

Expected: lime band scrolling, About split with B&W portrait on black, facts with lines. DE toggle changes bio and fact labels.

- [ ] **Step 6: Commit**

```bash
git add index.html src
git commit -m "feat: marquee and about"
```

---

### Task 7: Timeline (TDD for progress mapping)

**Files:**
- Create: `src/lib/progress.js`, `tests/progress.test.js`, `src/styles/timeline.css`, `src/sections/timeline.js`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Failing test `tests/progress.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { clamp, activeIndex } from '../src/lib/progress.js'

describe('clamp', () => {
  it('limits to range', () => {
    expect(clamp(-1, 0, 1)).toBe(0)
    expect(clamp(2, 0, 1)).toBe(1)
    expect(clamp(0.4, 0, 1)).toBe(0.4)
  })
})

describe('activeIndex', () => {
  it('maps progress 0..1 to evenly split slots', () => {
    expect(activeIndex(0, 5)).toBe(0)
    expect(activeIndex(0.19, 5)).toBe(0)
    expect(activeIndex(0.2, 5)).toBe(1)
    expect(activeIndex(0.99, 5)).toBe(4)
  })
  it('keeps the last slot at progress 1', () => {
    expect(activeIndex(1, 5)).toBe(4)
  })
  it('clamps out-of-range progress', () => {
    expect(activeIndex(-0.5, 5)).toBe(0)
    expect(activeIndex(3, 5)).toBe(4)
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- tests/progress.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/progress.js`**

```js
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Which of `count` equal slots a 0..1 progress value falls into.
export const activeIndex = (progress, count) => Math.min(count - 1, Math.floor(clamp(progress, 0, 1) * count))
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- tests/progress.test.js`
Expected: 4 passed.

- [ ] **Step 5: Timeline markup after About**

```html
<section class="tl" id="timeline">
  <div class="tl__pin">
    <div class="tl__head">
      <h2 class="tl__title disp" data-i18n="timeline.title">From keyframes…</h2>
      <div class="mono tl__comp">comp: career_v10.aep<br>00:00:16:00 · 25fps</div>
    </div>
    <ol class="tl__cards">
      <li class="tl__card card" style="--r:-3deg"><img src="./media/eraserboy_frame.webp" alt=""><p><b class="disp">2010</b><span data-i18n="timeline.y2010"></span></p></li>
      <li class="tl__card card" style="--r:2deg"><img src="./media/eraserboy_thumb.webp" alt=""><p><b class="disp">2014</b><span data-i18n="timeline.y2014"></span></p></li>
      <li class="tl__card card" style="--r:-1deg"><pre class="tl__code">const motion = await
  build(pipeline)
<i>// 500h Ironhack</i></pre><p><b class="disp">2022</b><span data-i18n="timeline.y2022"></span></p></li>
      <li class="tl__card card" style="--r:3deg"><img src="./media/edubites_ai_skills_desktop.webp" alt=""><p><b class="disp">2024</b><span data-i18n="timeline.y2024"></span></p></li>
      <li class="tl__card card" style="--r:-2deg"><div class="tl__mini"><i></i>—<i class="on"></i>—<i></i></div><p><b class="disp">2026</b><span data-i18n="timeline.y2026"></span></p></li>
    </ol>
    <div class="tl__ruler"><div class="tl__playhead"></div></div>
    <div class="tl__layers mono">
      <div class="tl__layer">1 · craft<span class="tl__bar" style="left:10%;width:80%"></span><span class="tl__kf" style="left:12%"></span><span class="tl__kf" style="left:31%"></span></div>
      <div class="tl__layer">2 · code<span class="tl__bar tl__bar--w" style="left:50%;width:40%"></span><span class="tl__kf" style="left:51%"></span><span class="tl__kf" style="left:70%"></span></div>
      <div class="tl__layer">3 · scale<span class="tl__bar" style="left:72%;width:18%"></span><span class="tl__kf" style="left:89%"></span></div>
    </div>
  </div>
</section>
```

Note: the 2014 card uses the Eraserboy thumbnail until a Camera Medica frame is supplied (asset follow-up).

- [ ] **Step 6: `src/styles/timeline.css`**

```css
.tl { background: var(--soft); border-top: var(--border); }
.tl__pin { min-height: 100vh; padding: 60px 0 50px; display: flex; flex-direction: column; justify-content: center; }
.tl__head { padding: 0 var(--gutter); display: flex; justify-content: space-between; align-items: end; }
.tl__title { font-size: clamp(56px, 9vw, 96px); }
.tl__cards { list-style: none; display: grid; grid-template-columns: repeat(5, 1fr); gap: 22px; margin: 36px var(--gutter) 30px; }
.tl__card { rotate: var(--r); opacity: .45; transform: scale(.94); transition: opacity .35s, transform .35s; }
.tl__card.is-on { opacity: 1; transform: scale(1.06); z-index: 2; }
.tl__card img, .tl__code, .tl__mini { height: 112px; width: 100%; object-fit: cover; }
.tl__code { margin: 0; background: #1e1e1e; color: var(--lime); padding: 10px; font: 11px/1.5 var(--font-mono); }
.tl__code i { color: #888; font-style: normal; }
.tl__mini { display: flex; align-items: center; justify-content: center; gap: 6px; border-bottom: var(--border); }
.tl__mini i { width: 22px; height: 16px; border: 2px solid var(--ink); }
.tl__mini i.on { background: var(--lime); }
.tl__card p { padding: 8px 10px; font-size: 13px; line-height: 1.35; }
.tl__card b { display: block; font-size: 30px; }
.tl__ruler { position: relative; margin: 0 var(--gutter); height: 26px; border: var(--border); border-bottom: 0; background: repeating-linear-gradient(90deg, var(--ink) 0 1.5px, transparent 1.5px 40px) bottom / 40px 8px repeat-x; }
.tl__playhead { position: absolute; top: -26px; height: 150px; width: 2px; left: 0; background: var(--green); }
.tl__playhead::before { content: ''; position: absolute; top: -2px; left: -7px; border: 8px solid transparent; border-top: 10px solid var(--green); }
.tl__layers { margin: 0 var(--gutter); border: var(--border); background: #fff; }
.tl__layer { position: relative; height: 30px; display: flex; align-items: center; padding-left: 10px; border-bottom: 1px solid #ccc; }
.tl__layer:last-child { border-bottom: 0; }
.tl__bar { position: absolute; top: 8px; height: 14px; background: var(--lime); border: 1.5px solid var(--ink); }
.tl__bar--w { background: #fff; }
.tl__kf { position: absolute; top: 9px; width: 12px; height: 12px; background: var(--ink); rotate: 45deg; }
.tl__kf.is-hit { background: var(--lime); border: 1.5px solid var(--ink); }
@media (max-width: 760px) {
  .tl__cards { grid-template-columns: 1fr; }
  .tl__ruler, .tl__layers, .tl__comp { display: none; }
  .tl__card { opacity: 1; transform: none; }
}
```

- [ ] **Step 7: `src/sections/timeline.js`**

```js
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
```

- [ ] **Step 8: Wire in `src/main.js` (append)**

```js
import './styles/timeline.css'
import { isMobile } from './lib/prefs.js'
import { initTimeline } from './sections/timeline.js'

const mobile = isMobile()
initTimeline({ reduced, mobile })
```

- [ ] **Step 9: Verify in browser**

Scroll into the timeline. Expected: section pins, green playhead travels left to right, keyframes turn lime as it passes, year cards light one by one (2010 to 2026), unpins after. On a 375px viewport cards stack, no pin.

- [ ] **Step 10: Commit**

```bash
git add index.html src tests
git commit -m "feat: pinned After Effects style career timeline"
```

---

### Task 8: Motion slab and bento

**Files:**
- Create: `src/styles/motion.css`, `src/sections/motion.js`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Markup after the timeline**

```html
<section class="slab" id="motion"><h2 class="slab__title disp">Mo<span class="lime">t</span>ion</h2>
<div class="bento">
  <div class="bento__item bento__item--a"><iframe src="https://www.youtube-nocookie.com/embed/VSI67Y0nnyo?rel=0" title="Showreel" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
  <button class="bento__item bento__item--b" data-yt="VSI67Y0nnyo"><video src="./media/curioso-capybara.mp4" poster="./media/curioso-capybara-poster.jpg" muted loop playsinline></video><span class="mono">Mundo Curioso · capybara</span></button>
  <button class="bento__item bento__item--c" data-yt="VSI67Y0nnyo"><video src="./media/biasgap-halo.mp4" poster="./media/biasgap-halo-poster.jpg" muted loop playsinline></video><span class="mono">The Bias Gap · Shorts</span></button>
  <div class="bento__item bento__item--d"><img src="./media/curioso_caju.webp" alt="Caju character"><span class="mono">Caju</span></div>
  <div class="bento__item bento__item--e"><img src="./media/biasgap_cover_28.webp" alt=""><span class="mono">The Bias Gap</span></div>
  <button class="bento__item bento__item--f" data-yt="UStyAQmSXkM"><img src="./media/eraserboy_frame.webp" alt="Eraserboy stop motion"><span class="mono">Eraserboy · stop motion</span></button>
  <div class="bento__item bento__item--g"><img src="./media/biasgap_cover_24.webp" alt=""><span class="mono">The Bias Gap</span></div>
  <button class="bento__item bento__item--h" data-yt="VSI67Y0nnyo"><video src="./media/biasgap-diderot.mp4" poster="./media/biasgap-diderot-poster.jpg" muted loop playsinline></video><span class="mono">The Bias Gap · Diderot effect</span></button>
</div>
</section>
<dialog class="lightbox"><button class="lightbox__close" aria-label="Close">×</button><div class="lightbox__frame"></div></dialog>
```

- [ ] **Step 2: `src/styles/motion.css`**

```css
.slab { background: var(--ink); color: #fff; padding: 60px var(--gutter); overflow: hidden; }
.slab__title { font-size: clamp(110px, 16vw, 200px); letter-spacing: 2px; }
.bento { display: grid; grid-template-columns: repeat(6, 1fr); grid-auto-rows: 14vh; gap: 16px; padding-top: 30px; }
.bento__item { position: relative; overflow: hidden; border: 2px solid #fff; background: #333; padding: 0; cursor: pointer; }
.bento__item img, .bento__item video, .bento__item iframe { width: 100%; height: 100%; object-fit: cover; border: 0; }
.bento__item span { position: absolute; left: 8px; bottom: 7px; color: #fff; background: rgba(35,35,35,.85); padding: 2px 5px; }
.bento__item--a { grid-column: span 3; grid-row: span 2; }
.bento__item--b { grid-column: span 3; }
.bento__item--c { grid-column: span 2; grid-row: span 2; }
.bento__item--d { grid-column: span 1; }
.bento__item--e, .bento__item--f, .bento__item--g, .bento__item--h { grid-column: span 2; }
.lightbox { margin: auto; width: min(92vw, 1100px); border: var(--border); box-shadow: var(--shadow); padding: 0; background: #000; }
.lightbox::backdrop { background: rgba(0,0,0,.8); }
.lightbox__frame { aspect-ratio: 16 / 9; }
.lightbox__frame iframe { width: 100%; height: 100%; border: 0; }
.lightbox__close { position: absolute; right: 8px; top: 4px; z-index: 2; font-size: 28px; background: none; color: #fff; border: 0; cursor: pointer; }
@media (max-width: 760px) {
  .bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 140px; }
  .bento > * { grid-column: span 1 !important; grid-row: span 1 !important; }
  .bento__item--a { grid-column: span 2 !important; grid-row: span 2 !important; }
}
```

- [ ] **Step 3: `src/sections/motion.js`**

```js
// Hover plays a loop. Click opens the YouTube video in a lightbox.
export function initMotion() {
  document.querySelectorAll('.bento video').forEach(v => {
    const item = v.closest('.bento__item')
    item.addEventListener('pointerenter', () => v.play().catch(() => {}))
    item.addEventListener('pointerleave', () => v.pause())
  })
  const box = document.querySelector('.lightbox')
  const frame = box.querySelector('.lightbox__frame')
  document.querySelectorAll('[data-yt]').forEach(el => el.addEventListener('click', () => {
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${el.dataset.yt}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`
    box.showModal()
  }))
  const close = () => { frame.innerHTML = ''; box.close() }
  box.querySelector('.lightbox__close').addEventListener('click', close)
  box.addEventListener('click', e => { if (e.target === box) close() })
}
```

- [ ] **Step 4: Wire in `src/main.js` (append)**

```js
import './styles/motion.css'
import { initMotion } from './sections/motion.js'
initMotion()
```

- [ ] **Step 5: Verify in browser**

Expected: one full-screen black section with "MOTION" (lime T) and the bento below it, reel plays inline, Diderot tile in the last slot, hovering capybara and Halo tiles plays them, clicking Eraserboy opens the Eraserboy teaser in the lightbox, Esc or × closes and stops it.

- [ ] **Step 6: Commit**

```bash
git add index.html src
git commit -m "feat: motion slab, bento and video lightbox"
```

---

### Task 9: Web section with devices

**Files:**
- Create: `src/styles/web.css`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Markup after the bento/lightbox**

```html
<section class="web" id="web">
  <div class="web__text">
    <h2 class="web__title disp" data-i18n="web.title">Built for the web</h2>
    <p class="web__lead"><a href="https://edubites.com/ai_skills/" target="_blank" rel="noopener" data-i18n="web.edubites"></a></p>
    <div class="web__learn">
      <a class="web__mini card" href="https://lougastardi.github.io/Procrastination-RPG-Game/" target="_blank" rel="noopener"><img src="./media/rpg_game.webp" alt="Procrastination game"><b>Procrastination</b><span data-i18n="web.rpg"></span> ↗</a>
      <a class="web__mini card" href="https://lougastardi.github.io/Codificador-de-texto/" target="_blank" rel="noopener"><img src="./media/encryptor.webp" alt="Message Decrypter"><b>Message Decrypter</b><span data-i18n="web.decrypter"></span> ↗</a>
    </div>
  </div>
  <div class="web__devices">
    <div class="web__bg"></div>
    <div class="web__laptop"><div class="web__screen"><img class="web__shot" src="./media/edubites_ai_skills_desktop.webp" alt="eduBITES AI Skill Assessment, desktop"></div><div class="web__base"></div></div>
    <div class="web__phone"><img class="web__shot" src="./media/edubites_ai_skills_mobile.webp" alt="eduBITES AI Skill Assessment, mobile"></div>
  </div>
</section>
```

- [ ] **Step 2: `src/styles/web.css`**

```css
main > section.web { display: grid; grid-template-columns: minmax(280px, 360px) 1fr; gap: 40px; align-content: center; padding: 70px var(--gutter); }
.web__title { font-size: clamp(72px, 10vw, 120px); }
.web__lead { font-size: 17px; line-height: 1.45; margin-top: 20px; }
.web__learn { display: flex; gap: 18px; margin: 28px 0 10px; }
.web__mini { width: 170px; text-decoration: none; font-size: 12px; padding-bottom: 6px; }
.web__mini img { height: 90px; width: 100%; object-fit: cover; object-position: top; border-bottom: var(--border); margin-bottom: 6px; }
.web__mini b, .web__mini span { display: block; padding: 0 8px; }
.web__devices { position: relative; min-height: 440px; isolation: isolate; }
.web__bg { position: absolute; left: 0; right: 120px; top: 70px; bottom: -20px; background: var(--lime); z-index: -1; }
.web__laptop { position: absolute; left: 40px; top: 30px; width: min(520px, 80%); }
.web__screen { height: 320px; border: 10px solid var(--ink); border-bottom-width: 14px; background: #fff; overflow: hidden; }
.web__base { height: 16px; background: var(--ink); margin: 0 -40px; border-radius: 0 0 10px 10px; }
.web__phone { position: absolute; right: 10px; top: 120px; width: 150px; height: 300px; border: 8px solid var(--ink); border-radius: 22px; background: #fff; overflow: hidden; box-shadow: var(--shadow); }
.web__shot { width: 100%; animation: shot-scroll 10s ease-in-out infinite alternate; }
.web__devices:hover .web__shot { animation-play-state: paused; }
@keyframes shot-scroll { to { transform: translateY(calc(-100% + 300px)); } }
@media (prefers-reduced-motion: reduce) { .web__shot { animation: none; } }
@media (max-width: 760px) {
  .web { grid-template-columns: 1fr; }
  .web__laptop { left: 0; width: 100%; }
  .web__screen { height: 220px; }
  .web__phone { top: 160px; width: 120px; height: 240px; }
}
```

- [ ] **Step 3: Import CSS in `src/main.js` (append)**

```js
import './styles/web.css'
```

- [ ] **Step 4: Verify in browser**

Expected: "BUILT FOR THE WEB", eduBITES screenshots scrolling inside laptop and phone on lime block, hover pauses, the two mini cards open the live projects in a new tab.

- [ ] **Step 5: Commit**

```bash
git add index.html src
git commit -m "feat: web section with device mockups"
```

---

### Task 10: Pipelines graph

**Files:**
- Create: `src/styles/pipelines.css`, `src/sections/pipelines.js`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Markup after the web section**

```html
<section class="pipe" id="pipelines">
  <h2 class="pipe__title disp" data-i18n="pipelines.title">…to pipelines.</h2>
  <p class="mono pipe__flow" data-i18n="pipelines.flow"></p>
  <div class="pipe__graph">
    <svg viewBox="0 0 1000 480" role="img" aria-label="Automated YouTube pipeline">
      <path class="pipe__wire" id="pipe-path" d="M120 67 H 900 V 247 H 120 V 427 H 560"/>
      <path class="pipe__wire pipe__wire--loop" d="M610 427 H 960 V 10 H 120 V 45"/>
      <text class="pipe__loop-label" x="700" y="462" data-i18n="pipelines.loop">insights feed the next topic</text>
      <circle class="pipe__dot" r="8" cx="120" cy="67"/>
      <g class="pipe__nodes"></g>
    </svg>
    <figure class="pipe__tip card" hidden><video muted loop playsinline></video><figcaption class="mono"></figcaption></figure>
  </div>
  <p class="pipe__hint mono" data-i18n="pipelines.hover"></p>

</section>
```

- [ ] **Step 2: `src/styles/pipelines.css`**

```css
.pipe { border-top: var(--border); padding: 70px var(--gutter) 80px; }
.pipe__title { font-size: clamp(64px, 10vw, 110px); }
.pipe__flow { margin-top: 26px; }
.pipe__graph { position: relative; }
.pipe__graph svg { width: 100%; height: auto; margin-top: 14px; overflow: visible; }
.pipe__wire { stroke: var(--ink); stroke-width: 2; fill: none; }
.pipe__dot { fill: var(--green); }
.pipe__wire--loop { stroke: var(--green); stroke-dasharray: 6 6; }
.pipe__loop-label { font: 600 10px var(--font-mono); letter-spacing: 1px; fill: var(--green); }
.pipe__node { cursor: pointer; }
.pipe__node .sh { fill: var(--lime); }
.pipe__node .bx { fill: #fff; stroke: var(--ink); stroke-width: 2; }
.pipe__node.is-dark .bx { fill: var(--ink); }
.pipe__node text { font: 600 12px var(--font-mono); letter-spacing: 1px; fill: var(--ink); }
.pipe__node.is-dark text { fill: var(--lime); }
.pipe__node:hover .bx { fill: var(--lime); }
.pipe__tip { position: absolute; width: 220px; pointer-events: none; rotate: 3deg; }
.pipe__tip video { width: 100%; height: 130px; object-fit: cover; }
.pipe__tip figcaption { padding: 6px 8px; }
.pipe__hint { margin-top: 10px; color: #777; }
@media (max-width: 760px) { .pipe__tip { display: none; } }
```

- [ ] **Step 3: `src/sections/pipelines.js`**

```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Node positions follow the path in index.html: row 1 left to right, row 2 right to left,
// row 3 (performance analytics, comment management) left to right. A dashed line loops back to TOPIC.
const NODES = [
  { id: 'topic', label: 'TOPIC', x: 70, y: 45 },
  { id: 'script', label: 'SCRIPT', x: 290, y: 45 },
  { id: 'voice', label: 'VOICE', x: 510, y: 45 },
  { id: 'frames', label: 'FRAMES', x: 730, y: 45 },
  { id: 'edit', label: 'EDIT', x: 730, y: 225 },
  { id: 'captions', label: 'CAPTIONS', x: 510, y: 225 },
  { id: 'upload', label: 'UPLOAD', x: 290, y: 225 },
  { id: 'youtube', label: 'YOUTUBE', x: 70, y: 225, dark: true },
  { id: 'analytics', label: 'ANALYTICS', x: 290, y: 405 },
  { id: 'comments', label: 'COMMENTS', x: 510, y: 405 }
]
// Clip shown on hover. All point to the Halo loop until per-step clips exist.
const CLIP = './media/biasgap-halo.mp4'

export function initPipelines({ reduced }) {
  const svgNS = 'http://www.w3.org/2000/svg'
  const g = document.querySelector('.pipe__nodes')
  const tip = document.querySelector('.pipe__tip')
  const tipVideo = tip.querySelector('video')
  const graph = document.querySelector('.pipe__graph')

  NODES.forEach(n => {
    const node = document.createElementNS(svgNS, 'g')
    node.setAttribute('class', `pipe__node${n.dark ? ' is-dark' : ''}`)
    node.innerHTML = `<rect class="sh" x="${n.x + 6}" y="${n.y + 6}" width="100" height="44"/><rect class="bx" x="${n.x}" y="${n.y}" width="100" height="44"/><text x="${n.x + 14}" y="${n.y + 27}">${n.label}</text>`
    node.addEventListener('pointerenter', () => {
      const box = node.getBoundingClientRect()
      const host = graph.getBoundingClientRect()
      tip.style.left = `${box.left - host.left + 30}px`
      tip.style.top = `${box.bottom - host.top + 10}px`
      tip.querySelector('figcaption').textContent = n.label.toLowerCase()
      if (tipVideo.getAttribute('src') !== CLIP) tipVideo.src = CLIP
      tip.hidden = false
      tipVideo.play().catch(() => {})
    })
    node.addEventListener('pointerleave', () => { tip.hidden = true; tipVideo.pause() })
    g.appendChild(node)
  })

  const path = document.getElementById('pipe-path')
  const dot = document.querySelector('.pipe__dot')
  const length = path.getTotalLength()
  const place = p => { const pt = path.getPointAtLength(p * length); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y) }
  if (reduced) { place(1); return }
  ScrollTrigger.create({ trigger: '.pipe__graph', start: 'top 80%', end: 'bottom 30%', scrub: true, onUpdate: s => place(s.progress) })
}
```

- [ ] **Step 4: Wire in `src/main.js` (append)**

```js
import './styles/pipelines.css'
import { initPipelines } from './sections/pipelines.js'
initPipelines({ reduced })
```

- [ ] **Step 5: Verify in browser**

Expected: 10 nodes with lime shadows (incl. ANALYTICS and COMMENTS on a third row), a dashed green line loops from COMMENTS back to TOPIC, the green dot travels the path as you scroll, hovering a node shows the clip card under it.

- [ ] **Step 6: Commit**

```bash
git add index.html src
git commit -m "feat: pipeline graph"
```

---

### Task 10b: Automation section (custom After Effects plugins)

**Files:**
- Create: `src/styles/automation.css`
- Modify: `index.html`, `src/main.js`, `src/i18n/en.json`, `src/i18n/de.json`, nav markup from Task 2

- [ ] **Step 1: Add the i18n keys**

In `src/i18n/en.json` add a top-level `"automation"` object and the nav key:

```json
"automation": {
  "title": "Automation",
  "intro": "Plugins I built for After Effects, made to measure for recurring projects. They take the repetitive steps out of the workflow, so more time goes into the parts that need a human eye."
}
```

and inside `"nav"`: `"automation": "Automation"`.

In `src/i18n/de.json`:

```json
"automation": {
  "title": "Automatisierung",
  "intro": "Plugins für After Effects, maßgeschneidert für wiederkehrende Projekte. Sie nehmen die repetitiven Schritte aus dem Workflow, damit mehr Zeit für die Teile bleibt, die ein menschliches Auge brauchen."
}
```

and inside `"nav"`: `"automation": "Automatisierung"`.

- [ ] **Step 2: Add the nav link** after the Pipelines link in `index.html`

```html
<a href="#automation" data-i18n="nav.automation">Automation</a>
```

- [ ] **Step 3: Markup right after the pipelines `</section>`**

```html
<section class="auto" id="automation">
  <div class="auto__head">
    <h2 class="auto__title disp" data-i18n="automation.title">Automation</h2>
    <p class="auto__intro" data-i18n="automation.intro"></p>
  </div>

  <div class="scripts">
    <article class="script card">
      <div class="script__tut"><img src="./media/eraserboy_frame.webp" alt="" class="script__poster"></div>
      <div class="script__body">
        <h3 class="disp">Animation Automation</h3>
        <p data-i18n="pipelines.aa"></p>
        <div class="script__meta"><span class="mono" data-i18n="pipelines.meta"></span><span class="script__dl is-soon" data-i18n="pipelines.soon">Soon</span></div>
      </div>
    </article>
    <article class="script card">
      <div class="script__tut"><img src="./media/biasgap_cover_24.webp" alt="" class="script__poster"></div>
      <div class="script__body">
        <h3 class="disp">Sequence from SRT</h3>
        <p data-i18n="pipelines.srt"></p>
        <div class="script__meta"><span class="mono" data-i18n="pipelines.meta"></span><span class="script__dl is-soon" data-i18n="pipelines.soon">Soon</span></div>
      </div>
    </article>
  </div>
</section>
```

The posters are temporary. The Remotion plan replaces each `<img class="script__poster">` with `<video>` and turns `.script__dl` into an `<a download>`.

- [ ] **Step 4: `src/styles/automation.css`**

```css
.auto { background: var(--ink); color: #fff; padding: 70px var(--gutter) 90px; }
.auto__head { display: grid; grid-template-columns: auto 1fr; gap: 40px; align-items: end; }
.auto__title { font-size: clamp(72px, 12vw, 160px); }
.auto__intro { font-size: 19px; line-height: 1.45; max-width: 520px; color: #ddd; }
.auto .script { color: var(--ink); }
.scripts { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; margin-top: 50px; }
.script__tut { height: 230px; background: #1d1d1d; border-bottom: var(--border); overflow: hidden; }
.script__tut img, .script__tut video { width: 100%; height: 100%; object-fit: cover; }
.script__body { padding: 16px 18px 18px; }
.script__body h3 { font-size: 30px; }
.script__body p { font-size: 15px; line-height: 1.45; margin: 8px 0 14px; }
.script__meta { display: flex; justify-content: space-between; align-items: center; }
.script__dl { background: var(--ink); color: #fff; padding: 10px 16px; font: 700 14px var(--font-body); box-shadow: var(--shadow-sm); text-decoration: none; }
.script__dl.is-soon { background: #999; box-shadow: none; }
@media (max-width: 760px) { .auto__head, .scripts { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: Import CSS in `src/main.js` (append)**

```js
import './styles/automation.css'
```

- [ ] **Step 6: Verify in browser**

Expected: black slab with "AUTOMATION" and the intro text, two script cards (Animation Automation, Sequence from SRT) with posters and a grey "Soon" button, nav shows Automation. DE toggle changes title to "Automatisierung" and the intro.

- [ ] **Step 7: Commit**

```bash
git add index.html src
git commit -m "feat: automation section with custom AE plugins"
```

---

### Task 11: Toolbox physics pile

**Files:**
- Create: `src/styles/toolbox.css`, `src/sections/toolbox.js`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Markup after the automation section**

```html
<section class="tools" id="toolbox">
  <h2 class="tools__title disp" data-i18n="toolbox.title">Toolbox</h2>
  <div class="tools__pile">
    <b>After Effects</b><b>Cinema 4D</b><b>Premiere Pro</b><b>Illustrator</b><b>Photoshop</b><b>Figma</b><b>Stop motion</b>
    <b>Image generation</b><b>Video generation</b><b>AI voiceover</b><b>Vibe coding</b><b>Workflow automation</b>
    <b>Editing</b><b>Color grading</b><b>Compositing</b><b>VFX</b><b>Audio mastering</b><b>Camera operation</b>
    <b>React</b><b>TypeScript</b><b>Node.js</b><b>Responsive design</b>
  </div>
</section>
```

- [ ] **Step 2: `src/styles/toolbox.css`**

```css
main > section.tools { background: var(--soft); border-top: var(--border); padding: 60px var(--gutter); display: grid; grid-template-columns: 330px 1fr; gap: 30px; align-content: center; }
.tools__title { font-size: clamp(64px, 9vw, 100px); }
.tools__pile { position: relative; height: 340px; display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; }
.tools__pile b { background: #fff; border: var(--border); box-shadow: var(--shadow-sm); padding: 7px 13px; font: 500 17px var(--font-body); user-select: none; }
.tools__pile.is-physics b { position: absolute; left: 0; top: 0; cursor: grab; }
@media (max-width: 760px) { .tools { grid-template-columns: 1fr; } .tools__pile { height: auto; } }
```

- [ ] **Step 3: `src/sections/toolbox.js`**

```js
import Matter from 'matter-js'

// Boxes drop into the pile when the section scrolls into view. Draggable.
// Without physics (mobile or reduced motion) they stay as a wrapped list.
export function initToolbox({ reduced, mobile }) {
  if (reduced || mobile) return
  const pile = document.querySelector('.tools__pile')
  const els = [...pile.querySelectorAll('b')]
  const { Engine, Bodies, Composite, Mouse, MouseConstraint, Runner } = Matter

  const start = () => {
    const sizes = els.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }))
    pile.classList.add('is-physics')
    const W = pile.clientWidth, H = pile.clientHeight
    const engine = Engine.create()
    const walls = [
      Bodies.rectangle(W / 2, H + 25, W, 50, { isStatic: true }),
      Bodies.rectangle(-25, H / 2, 50, H * 3, { isStatic: true }),
      Bodies.rectangle(W + 25, H / 2, 50, H * 3, { isStatic: true })
    ]
    const bodies = els.map((el, i) => Bodies.rectangle(
      40 + Math.random() * (W - 80), -60 - i * 45, sizes[i].w, sizes[i].h,
      { angle: (Math.random() - 0.5) * 0.4, restitution: 0.2, friction: 0.6, chamfer: { radius: 0 } }
    ))
    Composite.add(engine.world, [...walls, ...bodies])
    const mouse = Mouse.create(pile)
    mouse.element.removeEventListener('wheel', mouse.mousewheel)
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2 } }))
    Runner.run(Runner.create(), engine)
    const draw = () => {
      bodies.forEach((b, i) => {
        els[i].style.transform = `translate(${b.position.x - sizes[i].w / 2}px, ${b.position.y - sizes[i].h / 2}px) rotate(${b.angle}rad)`
      })
      requestAnimationFrame(draw)
    }
    draw()
  }

  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { io.disconnect(); start() }
  }, { threshold: 0.4 })
  io.observe(pile)
}
```

- [ ] **Step 4: Wire in `src/main.js` (append)**

```js
import './styles/toolbox.css'
import { initToolbox } from './sections/toolbox.js'
initToolbox({ reduced, mobile })
```

- [ ] **Step 5: Verify in browser**

Expected: when the section reaches 40% visibility, 22 boxes fall and pile up, can be dragged and thrown, page scroll still works with the wheel over the pile. On 375px: a wrapped list, no physics.

- [ ] **Step 6: Commit**

```bash
git add index.html src
git commit -m "feat: toolbox physics pile"
```

---

### Task 12: Contact and CV downloads

**Files:**
- Create: `src/styles/contact.css`, `public/cv/Lou_Gastardi_CV_EN.pdf`, `public/cv/Lou_Gastardi_Lebenslauf_DE.pdf`
- Modify: `index.html`, `src/main.js`

- [ ] **Step 1: Copy the CV PDFs**

Run:
```bash
mkdir -p public/cv
cp "$HOME/Desktop/Lou/Docs/CV HelloFresh/CV_Louise_Gastardi_HelloFresh_EN.pdf" public/cv/Lou_Gastardi_CV_EN.pdf
cp "$HOME/Desktop/Lou/Docs/CV HelloFresh/CV_Louise_Gastardi_HelloFresh_DE.pdf" public/cv/Lou_Gastardi_Lebenslauf_DE.pdf
```
Expected: two PDFs in `public/cv/`.

- [ ] **Step 2: Markup after the toolbox, then close `</main>`**

```html
<section class="contact" id="contact">
  <h2 class="contact__big disp"><span data-i18n="contact.title">Let's make things</span><br><span class="lime" data-i18n="contact.move">move.</span></h2>
  <a class="contact__mail" href="mailto:l.gastardi@hotmail.com">l.gastardi@hotmail.com</a>
  <div class="contact__btns">
    <a class="contact__btn" href="./cv/Lou_Gastardi_CV_EN.pdf" download>↓ <span data-i18n="contact.cvEn"></span></a>
    <a class="contact__btn" href="./cv/Lou_Gastardi_Lebenslauf_DE.pdf" download>↓ <span data-i18n="contact.cvDe"></span></a>
    <a class="contact__btn contact__btn--lime" href="https://www.youtube.com/watch?v=VSI67Y0nnyo" target="_blank" rel="noopener">▶ <span data-i18n="contact.reel"></span></a>
    <a class="contact__btn contact__btn--icon" href="https://www.linkedin.com/in/louisegastardi/" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.3 21 14.7V21h-4v-5.6c0-1.34-.03-3.06-1.86-3.06-1.87 0-2.16 1.46-2.16 2.96V21H9z"/></svg></a>
    <a class="contact__btn contact__btn--icon" href="https://github.com/louGastardi" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg></a>
    <a class="contact__btn contact__btn--icon" href="https://www.youtube.com/watch?v=VSI67Y0nnyo" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z"/></svg></a>
  </div>
</section>
```

- [ ] **Step 3: `src/styles/contact.css`**

```css
.contact { background: var(--ink); color: #fff; padding: 80px var(--gutter) 50px; overflow: hidden; }
.contact__big { font-size: clamp(64px, 13vw, 150px); }
.contact__mail { display: inline-block; font-size: clamp(22px, 3.4vw, 38px); margin: 26px 0 36px; border-bottom: 3px solid var(--lime); text-decoration: none; }
.contact__btns { display: flex; flex-wrap: wrap; gap: 20px; }
.contact__btn { background: #fff; color: var(--ink); border: 2px solid #fff; box-shadow: 6px 6px 0 var(--lime); padding: 14px 22px; font: 700 18px var(--font-body); text-decoration: none; }
.contact__btn--lime { background: var(--lime); }
.contact__btn:hover { translate: -2px -2px; box-shadow: 8px 8px 0 var(--lime); }
.contact__btn--icon { display: flex; align-items: center; justify-content: center; width: 56px; padding: 0; }
.contact__btn--icon svg { width: 24px; height: 24px; fill: var(--ink); }
```

- [ ] **Step 4: Import CSS in `src/main.js` (append)**

```js
import './styles/contact.css'
```

- [ ] **Step 5: Verify in browser**

Expected: black contact slab, "LET'S MAKE THINGS MOVE." with lime last line, mail link, both CV buttons download the right PDF, LinkedIn, GitHub and YouTube icon buttons in the same row open in a new tab, DE toggle changes title to "Bringen wir Dinge in Bewegung."

- [ ] **Step 6: Commit**

```bash
git add index.html src public/cv
git commit -m "feat: contact section with CV downloads"
```

---

### Task 13: Quality pass (reduced motion, mobile, performance)

**Files:**
- Modify: any section CSS/JS that fails a check below

- [ ] **Step 1: Reduced motion**

In Chrome DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`, reload.
Expected: no marquee motion, no pin on timeline (all cards lit), crystal static apart from mouse tilt, devices not scrolling, toolbox as list, pipeline dot at end.

- [ ] **Step 2: Mobile**

Viewport 375×812.
Expected: every section at least one screen tall, no horizontal scroll (`document.documentElement.scrollWidth === 375` in console), all sections stacked, nav links hidden, EN/DE visible.

- [ ] **Step 3: Copy check**

Run: `grep -nE "—|;" src/i18n/en.json src/i18n/de.json index.html | grep -v "&[a-z]*;" || echo clean`
Expected: `clean`.

- [ ] **Step 4: Build size and Lighthouse**

Run: `npm run build && du -sh dist && npx vite preview --port 4173`
Then Lighthouse (desktop) on `http://localhost:4173/portfolio/`.
Expected: dist under 10 MB, Performance 85+. If lower, lazy-load the bento videos (`preload="none"`) and the toolbox Matter import (`await import('matter-js')`).

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all tests pass (9).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: quality pass for reduced motion, mobile and performance"
```

---

### Task 14: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages"
```

- [ ] **Step 3: Create the repo and push (ask Lou before running, this publishes the site)**

Run:
```bash
git branch -M main
gh repo create louGastardi/portfolio --public --source . --push
gh api -X POST repos/louGastardi/portfolio/pages -f build_type=workflow
```
Expected: Actions run "Deploy" passes, site live at `https://lougastardi.github.io/portfolio/`.

- [ ] **Step 4: Point the website icon on CV and LinkedIn to the live URL**

Modify `~/Desktop/Lou/Docs/CV HelloFresh/styles.py`: replace `WEBSITE = "#website-coming-soon"  # TODO: replace with real site URL when online` with `WEBSITE = "https://lougastardi.github.io/portfolio/"`, then run `python3 styles.py D en de` in that folder.
Expected: both CV PDFs rebuilt with the working website icon.

---

## Follow-up plans (not in this plan)

1. **After Effects scripts, English UI:** translate panel labels and dialogs of `~/Desktop/eduBites/edubites-videos/ae-scripts/Lou - Animation Automation.jsx` and `Lou - Sequence from SRT.jsx`, keep logic untouched, ship to `public/scripts/`.
2. **Remotion tutorials:** one 20 to 30 s screen-style video per script (fake AE UI, moving cursor, click, result), rendered to mp4/webm, replaces the posters in Task 10 and enables the Download buttons.
3. **Media follow-ups:** final showreel ID, loops cut from the final reel, a Camera Medica frame for the 2014 card, old stop motion from Google Drive, per-step pipeline clips.
