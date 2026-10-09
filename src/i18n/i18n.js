// Tiny dictionary-based i18n. Keys are dot paths into nested JSON.
function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node != null && typeof node === 'object' && part in node ? node[part] : undefined), dict)
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
      root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAria)) })
      document.documentElement.lang = lang
    }
  }
}
