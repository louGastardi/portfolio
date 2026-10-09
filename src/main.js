import './styles/tokens.css'
import './styles/base.css'
import './styles/nav.css'
import en from './i18n/en.json'
import de from './i18n/de.json'
import { createI18n } from './i18n/i18n.js'
import { initNav } from './sections/nav.js'

const i18n = createI18n({ en, de }, 'en')
initNav(i18n)

import './styles/hero.css'
import { reducedMotion } from './lib/prefs.js'
import { initHero } from './sections/hero.js'

const reduced = reducedMotion()
initHero({ reduced })
