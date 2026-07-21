import { Link } from 'react-router-dom'
import type { MarketingLang } from '../../../lib/language'

const LEGAL_LINKS: Record<MarketingLang, { to: string; label: string }[]> = {
  de: [
    { to: '/kontakt', label: 'Kontakt' },
    { to: '/impressum', label: 'Impressum' },
    { to: '/agb', label: 'AGB' },
    { to: '/datenschutz', label: 'Datenschutz' },
  ],
  en: [
    { to: '/kontakt', label: 'Contact' },
    { to: '/impressum', label: 'Imprint' },
    { to: '/agb', label: 'Terms' },
    { to: '/datenschutz', label: 'Privacy Policy' },
  ],
}

const FOOTER_TEXT: Record<MarketingLang, string> = {
  de: 'TacticBoard Pro — ein Produkt von 9011 Soccer, Teil der Marken',
  en: 'TacticBoard Pro — a product by 9011 Soccer, part of the',
}

const FOOTER_JOIN: Record<MarketingLang, string> = {
  de: 'und',
  en: 'and',
}

export function MarketingFooter({ lang = 'de' }: { lang?: MarketingLang }) {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
      <p>
        {FOOTER_TEXT[lang]}{' '}
        <a
          href="https://9011soccer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white/90"
        >
          9011soccer.com
        </a>{' '}
        {FOOTER_JOIN[lang]}{' '}
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
        {LEGAL_LINKS[lang].map((link) => (
          <Link key={link.to} to={link.to} className="text-white/50 hover:text-white/80">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
