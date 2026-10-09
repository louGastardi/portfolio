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
