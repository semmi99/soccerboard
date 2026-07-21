export type MarketingLang = 'de' | 'en' | 'es'

const STORAGE_KEY = 'tacticboard-lang'

export function getStoredLang(): MarketingLang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'es' ? stored : 'de'
  } catch {
    return 'de'
  }
}

export function storeLang(lang: MarketingLang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
