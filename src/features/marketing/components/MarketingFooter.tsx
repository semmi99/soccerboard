import { Link } from 'react-router-dom'

const LEGAL_LINKS = [
  { to: '/kontakt', label: 'Kontakt' },
  { to: '/impressum', label: 'Impressum' },
  { to: '/agb', label: 'AGB' },
  { to: '/datenschutz', label: 'Datenschutz' },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
      <p>
        TacticBoard Pro — ein Produkt von 9011 Soccer, Teil der Marken 9011soccer.com und
        socceranalyticspro.com
      </p>
      <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="text-white/50 hover:text-white/80">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
