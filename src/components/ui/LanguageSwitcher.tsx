import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../features/auth/store/authStore'

const LANGUAGES = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
] as const

/** Small DE/EN toggle. Changing it switches `i18next`'s active language
 * immediately and, if signed in, persists the choice to the profile so it
 * follows the account across devices (see `updateProfileLocale`). */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const updateProfileLocale = useAuthStore((s) => s.updateProfileLocale)

  function handleChange(lang: 'de' | 'en') {
    void i18n.changeLanguage(lang)
    if (profile) void updateProfileLocale(lang)
  }

  const active = i18n.language.startsWith('en') ? 'en' : 'de'

  return (
    <div className={`flex items-center gap-0.5 rounded-md border border-pitch-600 bg-pitch-800 p-0.5 ${className}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => handleChange(lang.code)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            active === lang.code
              ? 'bg-violet-accent text-brand-blue-dark'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
