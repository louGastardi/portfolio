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
