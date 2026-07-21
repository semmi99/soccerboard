export type MarketingLang = 'de' | 'en'

const STORAGE_KEY = 'tacticboard-lang'

export function getStoredLang(): MarketingLang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'de'
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
