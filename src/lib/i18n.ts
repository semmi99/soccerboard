import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import commonDe from '../locales/de/common.json'
import commonEn from '../locales/en/common.json'

/** Same localStorage key `lib/language.ts` used pre-i18next, so a language
 * choice made on the marketing/auth pages before login survives into the
 * detector here instead of resetting to the browser default. */
export const LOCALE_STORAGE_KEY = 'tacticboard-lang'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { common: commonDe },
      en: { common: commonEn },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
