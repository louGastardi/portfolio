# Lou Gastardi Portfolio: Design Spec

Date: 2026-10-09
Status: approved in brainstorming, waiting for written-spec review
Visual reference: `.superpowers/brainstorm/98262-1791471131/content/page-mockup.html` (served at `http://127.0.0.1:8765/...`)

## 1. Goal

A one-page scroll portfolio for Lou Gastardi (Motion Designer / Creative Technologist, Berlin). It has to show motion craft, web work and automation work in one place, feel personal and not templated, and stay visually tied to the CV and LinkedIn (same colors, type and solid offset shadows).

Primary use: send with job applications (first target: HelloFresh Senior Motion Designer). Secondary: personal brand page linked from LinkedIn and CV.

## 2. Visual system

- Colors: white `#FFFFFF`, ink `#232323`, lime `#91C11E`, dark green `#067A46`, soft gray `#F4F4F1` for alternating sections.
- Type: Anton (condensed display, section titles and the giant name), Space Grotesk (body), JetBrains Mono (small labels, UI-like text).
- Cards and boxes: square corners, 2px ink border, solid lime offset shadow (no rounded corners, no textures, no handwriting, no stamps).
- Direction: "editorial collage", top part of option C from brainstorming. Big type that bleeds off the screen, tilted cards, high contrast black slabs between white sections.
- Copy rules: English and German. No em dashes, no semicolons, few adjectives.
- Layout: every section fills at least one full screen (100vh), content centered vertically.

## 3. Page structure

Fixed top bar: `LG` monogram, section links (About, Timeline, Motion, Web, Pipelines, Automation, Contact), EN/DE toggle.

No small "eyebrow" labels above section titles.

### 00 Hero
- Giant "LOU / GASTARDI" in Anton, bleeding off the left edge.
- Role line: "Motion Designer / Creative Technologist · Berlin". No slogan here.
- 3D keyframe crystal (Three.js), center right. Rotates with the mouse, slow idle spin.
- 3 tilted work cards with lime shadow that drift with the mouse: Mundo Curioso penguin loop (video), eduBITES AI Skill Assessment (screenshot), The Bias Gap cover.

### Marquee strip
Lime band with a running list: Motion design ◆ After Effects ◆ Cinema 4D ◆ AI video ◆ Automation ◆ Web ◆ Stop motion.

### 01 About
- Split layout. Left: "ABOUT ME:" with lime underline, short bio, form-like fact lines (Based in, Doing, Speaks).
- Right: black panel with the portrait from 2026-10-08 (Flow, mirrored, black and white).

### 02 Timeline ("From keyframes…")
- Pinned section. A real After Effects style timeline: ruler, 3 layers (craft, code, scale), keyframes, green playhead that moves with scroll.
- The hero crystal splits into 5 keyframes that land on this timeline.
- 5 cards above the timeline, the active one grows and lights up:
  - 2010 Bauhaus Weimar, stop motion (Eraserboy frame)
  - 2014 Camera Medica, motion for hundreds of clients
  - 2022 learned to code (ONE, Ironhack), code card
  - 2024 eduBITES, courses, motion, web
  - 2026 Creative Technologist, pipelines (mini node diagram)

### 03 Motion
- One full-screen black section: giant "MOTION" (the T in lime) with the bento grid below it.
- Bento grid of loops, different sizes:
  - Showreel: YouTube embed `VSI67Y0nnyo` (placeholder reel, will be swapped)
  - Mundo Curioso capybara loop
  - The Bias Gap Halo Effect loop
  - Caju character still
  - Eraserboy stop motion teaser (YouTube `UStyAQmSXkM`, frame as poster)
  - 2 The Bias Gap covers
  - The Bias Gap Diderot effect loop (last tile)
- Hover plays a loop, click opens the full video.

### 04 Web ("Built for the web")
- eduBITES AI Skill Assessment (`edubites.com/ai_skills/`) shown in a laptop and a phone on a lime block. Real full-page screenshots auto-scroll inside the screens.
- Small row: Procrastination RPG (`lougastardi.github.io/Procrastination-RPG-Game/`) and Message Decrypter (`lougastardi.github.io/Codificador-de-texto/`), each a small card with a real screenshot and a link.

### 05 Pipelines ("…to pipelines.")
- Node graph of The Bias Gap automated YouTube channel: Topic → Script → Voice → Frames → Edit → Captions → Upload → YouTube → Performance analytics → Comment management. A dashed line loops from the last step back to Topic ("insights feed the next topic"). A green dot travels the path on scroll. Hovering a node shows a short clip of that step.

### 05b Automation
- Black slab after Pipelines. Title "AUTOMATION" and a short intro: plugins built for After Effects, made to measure for recurring projects, to speed up the workflow.
- Downloadable plugins, one card each:
  - Animation Automation (ScriptUI panel)
  - Sequence from SRT
  - Each card: tutorial video box on top (screen recording style with a moving cursor, made in Remotion), name, short description, ".jsx · AE 2024+ · free", Download button.
  - Both scripts get an English UI version before publishing.

### 06 Toolbox
- Skill boxes from the CV (Motion & 3D, AI, Video, Code) fall in and pile up with simple physics when the section enters the screen. They can be dragged.

### 07 Contact
- Black slab, giant "LET'S MAKE THINGS MOVE." (MOVE in lime), e-mail, one row of buttons: CV English, Lebenslauf Deutsch, Showreel, then square icon buttons for LinkedIn, GitHub and YouTube.

## 4. Tech

- Vite + vanilla JavaScript, GSAP + ScrollTrigger for scroll animation, Three.js for the crystal, a small physics lib (Matter.js) for the toolbox.
- Single page `index.html`, one CSS file with tokens, one JS module per section (`hero.js`, `timeline.js`, `motion.js`, `web.js`, `pipelines.js`, `toolbox.js` (automation is markup and CSS only)), `i18n.js` with `en.json` and `de.json`.
- Media in `public/media/`, compressed (loops as short H.264 mp4 + webm, images as webp).
- Respect `prefers-reduced-motion`: no pinning, no physics, static crystal.
- Mobile: same sections stacked, timeline becomes vertical, no physics (boxes just listed), crystal smaller.
- Hosting: GitHub Pages (repo `louGastardi/portfolio`), custom domain later.

## 5. Assets and status

| Asset | Status |
|---|---|
| Portrait (Flow, mirrored) | ready, `assets/lou_portrait.jpg` |
| eduBITES AI Skills screenshots (desktop, mobile) | ready |
| RPG and Decrypter screenshots | ready |
| The Bias Gap covers and Halo loop | ready |
| Mundo Curioso capybara and penguin loops, Caju | ready |
| Eraserboy teaser | ready. Unlisted on YouTube (`UStyAQmSXkM`), embeddable. Frame and thumbnail in `assets/` |
| Showreel | temporary YouTube `VSI67Y0nnyo`, will be replaced |
| Loops cut from the reel | to do after the final reel |
| Old stop motion material from Google Drive | to search |
| After Effects scripts (EN versions) | to do |
| Script tutorial videos (Remotion) | to do |
| CV PDFs EN/DE | ready in `Docs/CV HelloFresh/` |
| Pipeline node clips | to do |

## 6. Out of scope (for now)

- Case study subpages per project (could move to Astro later).
- Blog, CMS, contact form (e-mail link only).
- Analytics.

## 7. Success criteria

- Loads under 3 s on a normal connection, Lighthouse performance 85+ on desktop.
- Works and reads well on mobile.
- EN/DE switch covers all text.
- Every section looks different from the others but uses the same colors, type and shadow.
- Recruiter can reach reel, CV and e-mail in one click from anywhere (top bar and contact).
