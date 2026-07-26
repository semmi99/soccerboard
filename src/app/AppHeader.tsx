import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../features/auth/store/authStore'
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher'

export function AppHeader() {
  const { t } = useTranslation()
  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const location = useLocation()

  const navItems = [
    { to: '/dashboard', label: t('common:nav.projects') },
    { to: '/squad', label: t('common:nav.squad') },
    { to: '/formations', label: t('common:nav.formations') },
    { to: '/account', label: t('common:nav.account') },
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: t('common:nav.admin') }] : []),
  ]

  return (
    <header className="flex items-center justify-between border-b border-pitch-700 px-8 py-4">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-white">{organization?.name}</span>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                location.pathname.startsWith(item.to)
                  ? 'bg-violet-accent/20 text-violet-accent-bright'
                  : 'text-white/60 hover:bg-pitch-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-white/40 hover:text-white/70"
        >
          {t('common:actions.signOut')}
        </button>
      </div>
    </header>
  )
}
