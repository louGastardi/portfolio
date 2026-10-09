import './styles/tokens.css'
import './styles/base.css'
import './styles/nav.css'
import './styles/hero.css'
import './styles/marquee.css'
import './styles/about.css'
import './styles/timeline.css'
import en from './i18n/en.json'
import de from './i18n/de.json'
import { createI18n } from './i18n/i18n.js'
import { reducedMotion } from './lib/prefs.js'
import { initNav } from './sections/nav.js'
import { initHero } from './sections/hero.js'
import { initMarquee } from './sections/marquee.js'
import { initTimeline, refreshOnLayoutChange } from './sections/timeline.js'

const i18n = createI18n({ en, de }, 'en')
initNav(i18n)

const reduced = reducedMotion()
initHero({ reduced })

initMarquee(document.querySelector('.marquee__run'), () => (i18n.lang === 'de' ? de : en).marquee)

initTimeline()

// Keep last: re-measures every ScrollTrigger once images and fonts settle
refreshOnLayoutChange()
