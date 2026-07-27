import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import commonDe from '../locales/de/common.json'
import commonEn from '../locales/en/common.json'
import authDe from '../locales/de/auth.json'
import authEn from '../locales/en/auth.json'
import projectsDe from '../locales/de/projects.json'
import projectsEn from '../locales/en/projects.json'
import squadDe from '../locales/de/squad.json'
import squadEn from '../locales/en/squad.json'
import formationsDe from '../locales/de/formations.json'
import formationsEn from '../locales/en/formations.json'
import accountDe from '../locales/de/account.json'
import accountEn from '../locales/en/account.json'
import adminDe from '../locales/de/admin.json'
import adminEn from '../locales/en/admin.json'
import legalDe from '../locales/de/legal.json'
import legalEn from '../locales/en/legal.json'
import editorDe from '../locales/de/editor.json'
import editorEn from '../locales/en/editor.json'

/** Same localStorage key `lib/language.ts` used pre-i18next, so a language
 * choice made on the marketing/auth pages before login survives into the
 * detector here instead of resetting to the browser default. */
export const LOCALE_STORAGE_KEY = 'tacticboard-lang'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        common: commonDe,
        auth: authDe,
        projects: projectsDe,
        squad: squadDe,
        formations: formationsDe,
        account: accountDe,
        admin: adminDe,
        legal: legalDe,
        editor: editorDe,
      },
      en: {
        common: commonEn,
        auth: authEn,
        projects: projectsEn,
        squad: squadEn,
        formations: formationsEn,
        account: accountEn,
        admin: adminEn,
        legal: legalEn,
        editor: editorEn,
      },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    ns: ['common', 'auth', 'projects', 'squad', 'formations', 'account', 'admin', 'legal', 'editor'],
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
