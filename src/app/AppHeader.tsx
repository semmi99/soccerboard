import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Projekte' },
  { to: '/squad', label: 'Kader' },
  { to: '/formations', label: 'Formationen' },
]

export function AppHeader() {
  const organization = useAuthStore((s) => s.organization)
  const signOut = useAuthStore((s) => s.signOut)
  const location = useLocation()

  return (
    <header className="flex items-center justify-between border-b border-pitch-700 px-8 py-4">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-white">{organization?.name}</span>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
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
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm text-white/40 hover:text-white/70"
      >
        Abmelden
      </button>
    </header>
  )
}
