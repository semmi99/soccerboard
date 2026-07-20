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
        TacticBoard Pro — ein Produkt von 9011 Soccer, Teil der Marken{' '}
        <a
          href="https://9011soccer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white/90"
        >
          9011soccer.com
        </a>{' '}
        und{' '}
        <a
          href="https://socceranalyticspro.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white/90"
        >
          socceranalyticspro.com
        </a>
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
