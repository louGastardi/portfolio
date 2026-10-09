import { describe, it, expect, beforeEach } from 'vitest'
import { createI18n } from '../src/i18n/i18n.js'
import { initNav } from '../src/sections/nav.js'

const dicts = { en: { nav: { about: 'About' } }, de: { nav: { about: 'Über mich' } } }

describe('nav language toggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = `
      <div class="nav__lang">
        <button data-lang="en" aria-pressed="false">EN</button>
        <button data-lang="de" aria-pressed="false">DE</button>
      </div>`
  })

  it('ignores an unsupported saved language and stores the active one', () => {
    localStorage.setItem('lang', 'fr')
    const i18n = createI18n(dicts, 'en')
    initNav(i18n)
    expect(document.querySelector('[data-lang="en"]').getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('[data-lang="de"]').getAttribute('aria-pressed')).toBe('false')
    expect(localStorage.getItem('lang')).toBe('en')
  })

  it('switches to DE on click and remembers it', () => {
    const i18n = createI18n(dicts, 'en')
    initNav(i18n)
    document.querySelector('[data-lang="de"]').click()
    expect(i18n.lang).toBe('de')
    expect(document.querySelector('[data-lang="de"]').getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('lang')).toBe('de')
  })
})
