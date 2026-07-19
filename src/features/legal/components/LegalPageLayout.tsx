import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MarketingFooter } from '../../marketing/components/MarketingFooter'

export function LegalPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#0d1420] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-blue-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-blue-dark">
              9011
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">TacticBoard Pro</p>
              <p className="text-[11px] text-white/60">by 9011 Soccer</p>
            </div>
          </Link>
          <Link to="/" className="text-sm font-medium text-white/80 hover:text-white">
            Zur Startseite
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-8 text-3xl font-black">{title}</h1>
        <div className="legal-content flex flex-col gap-5 text-sm leading-relaxed text-white/80">
          {children}
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
