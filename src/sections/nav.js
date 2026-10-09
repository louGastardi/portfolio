// Wires the EN/DE buttons. Remembers the choice per visitor.
export function initNav(i18n) {
  const buttons = document.querySelectorAll('.nav__lang button')
  const set = lang => {
    // setLang ignores unsupported values, so read back what is actually active
    i18n.setLang(lang)
    const active = i18n.lang
    i18n.apply(document)
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === active)))
    try { localStorage.setItem('lang', active) } catch {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: active }))
  }
  buttons.forEach(b => b.addEventListener('click', () => set(b.dataset.lang)))
  let saved = null
  try { saved = localStorage.getItem('lang') } catch {}
  const preferred = navigator.languages?.find(l => /^(de|en)/.test(l)) || navigator.language || ''
  const browser = preferred.startsWith('de') ? 'de' : 'en'
  set(saved || browser)
}
