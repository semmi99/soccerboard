import { Link } from 'react-router-dom'
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '../../../lib/limits'
import { MarketingFooter } from './MarketingFooter'

const FEATURES = [
  {
    title: 'Taktik-Editor',
    text: 'Spieler, Pfeile, Formen, Zonen und Trainingsutensilien frei auf dem Feld platzieren, drehen und skalieren.',
  },
  {
    title: 'Animierte Spielzüge',
    text: 'Mehrere Frames anlegen und flüssig, synchron abspielen — Spielzüge werden lebendig statt statisch.',
  },
  {
    title: 'Eigene Formationen',
    text: 'Positionen frei per Drag & Drop anlegen, benennen und für jedes Projekt wiederverwenden.',
  },
  {
    title: 'Kaderverwaltung',
    text: 'Echten Kader pflegen und Spieler direkt mit Chips im Editor verknüpfen — inklusive Trikot-Design.',
  },
  {
    title: 'Export in hoher Auflösung',
    text: 'Taktiktafeln als PNG/JPG exportieren, bis zu 4K für Präsentationen und Ausdrucke.',
  },
  {
    title: 'Für dein Team gemacht',
    text: 'Mehrere Projekte, mehrere Trainer, ein gemeinsamer Kader — alles an einem Ort.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '0 €',
    period: '',
    description: 'Zum Ausprobieren und für kleine Teams.',
    features: [
      `${FREE_TIER_LIMITS.maxProjects} Projekte`,
      `${FREE_TIER_LIMITS.maxFrames} Frames pro Projekt`,
      `Export bis ${FREE_TIER_LIMITS.maxExportPixelRatio}x Auflösung`,
      'Alle Editor-Werkzeuge',
    ],
    cta: 'Kostenlos starten',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '4,99 €',
    period: '/ Monat',
    description: 'Für Vereine und Trainer, die keine Grenzen wollen.',
    features: [
      'Unbegrenzte Projekte',
      'Unbegrenzte Frames pro Projekt',
      `Export bis ${PRO_TIER_LIMITS.maxExportPixelRatio}x Auflösung`,
      'Alle Editor-Werkzeuge',
      'Priorisierter Support',
    ],
    cta: 'Pro werden',
    highlighted: true,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-full bg-[#0d1420] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-blue-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-blue-dark">
              9011
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">TacticBoard Pro</p>
              <p className="text-[11px] text-white/60">by 9011 Soccer</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/80 sm:flex">
            <a href="#features" className="hover:text-white">
              Funktionen
            </a>
            <a href="#pricing" className="hover:text-white">
              Preise
            </a>
            <a
              href="https://9011soccer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              9011soccer.com
            </a>
            <a
              href="https://socceranalyticspro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              SoccerAnalyticsPro
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white">
              Anmelden
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-blue-dark transition-colors hover:brightness-105"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue to-brand-blue-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <span className="rounded-full border border-brand-gold/50 bg-brand-gold/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-gold">
            9011 SOCCER
          </span>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Taktiken planen. Spielzüge animieren.
            <br />
            Für dein Team.
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            Der Taktik-Editor für Trainer: Aufstellungen bauen, Spielzüge animieren und mit deinem Kader
            teilen — direkt im Browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="rounded-lg bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-blue-dark shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]"
            >
              Kostenlos starten
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Preise ansehen
            </a>
          </div>

          <div className="mt-6 w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/30 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </div>
            <img
              src="/marketing/hero-formation.svg"
              alt="Taktiktafel im TacticBoard-Pro-Editor: Überzahl-Zone, gebogener Steckpass, Laufweg, Hervorhebung und Beschriftung in einer Szene"
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Alles, was dein Training braucht</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-brand-gold/40"
            >
              <div className="mb-3 h-1.5 w-8 rounded-full bg-brand-maroon" />
              <h3 className="mb-1.5 text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-white/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-[#0a0f18] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Einfache, faire Preise</h2>
          <p className="mt-2 text-sm text-white/50">Jederzeit kündbar. Kein Risiko.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? 'border-brand-yellow bg-brand-blue-dark/60 shadow-xl shadow-brand-blue/20'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {plan.highlighted && (
                <span className="mb-3 self-start rounded-full bg-brand-yellow px-2.5 py-1 text-[11px] font-bold text-brand-blue-dark">
                  BELIEBT
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-white/50">{plan.description}</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-sm text-white/50">{plan.period}</span>
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-white/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-brand-yellow text-brand-blue-dark hover:brightness-105'
                    : 'border border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
