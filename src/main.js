import './styles/tokens.css'
import './styles/base.css'
import './styles/nav.css'
import './styles/hero.css'
import './styles/marquee.css'
import './styles/about.css'
import en from './i18n/en.json'
import de from './i18n/de.json'
import { createI18n } from './i18n/i18n.js'
import { reducedMotion } from './lib/prefs.js'
import { initNav } from './sections/nav.js'
import { initHero } from './sections/hero.js'

const i18n = createI18n({ en, de }, 'en')
initNav(i18n)

const reduced = reducedMotion()
initHero({ reduced })

const fillMarquee = () => {
  const items = (i18n.lang === 'de' ? de : en).marquee
  const run = items.map(w => `<em>${w}</em>◆`).join('')
  document.querySelector('.marquee__run').innerHTML = run + run
}
fillMarquee()
document.addEventListener('langchange', fillMarquee)
