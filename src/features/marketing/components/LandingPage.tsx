import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '../../../lib/limits'
import { getStoredLang, storeLang, type MarketingLang } from '../../../lib/language'
import { MarketingFooter } from './MarketingFooter'

const NAV = {
  de: { features: 'Funktionen', pricing: 'Preise', login: 'Anmelden', signup: 'Registrieren' },
  en: { features: 'Features', pricing: 'Pricing', login: 'Log in', signup: 'Sign up' },
}

const HERO = {
  de: {
    title: (
      <>
        Taktiken planen. Spielzüge animieren.
        <br />
        Für dein Team.
      </>
    ),
    text: 'Der Taktik-Editor für Trainer: Aufstellungen bauen, Spielzüge animieren und mit deinem Kader teilen — direkt im Browser.',
    ctaPrimary: 'Kostenlos starten',
    ctaSecondary: 'Preise ansehen',
    imageAlt:
      'Taktiktafel im TacticBoard-Pro-Editor: Überzahl-Zone, gebogener Steckpass, Laufweg, Hervorhebung und Beschriftung in einer Szene',
  },
  en: {
    title: (
      <>
        Plan tactics. Animate plays.
        <br />
        For your team.
      </>
    ),
    text: 'The tactics editor for coaches: build formations, animate plays, and share them with your squad — right in the browser.',
    ctaPrimary: 'Start for free',
    ctaSecondary: 'View pricing',
    imageAlt:
      'Tactics board in the TacticBoard Pro editor: overload zone, curved through pass, run path, highlight, and caption in one scene',
  },
}

const FEATURES = {
  de: [
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
  ],
  en: [
    {
      title: 'Tactics Editor',
      text: 'Freely place, rotate, and scale players, arrows, shapes, zones, and training equipment on the pitch.',
    },
    {
      title: 'Animated Plays',
      text: 'Create multiple frames and play them back smoothly — plays come alive instead of staying static.',
    },
    {
      title: 'Custom Formations',
      text: 'Drag and drop to build positions, name them, and reuse them across every project.',
    },
    {
      title: 'Squad Management',
      text: 'Maintain your real squad and link players directly to chips in the editor — including kit design.',
    },
    {
      title: 'High-Resolution Export',
      text: 'Export tactics boards as PNG/JPG, up to 4K for presentations and printouts.',
    },
    {
      title: 'Built for Your Team',
      text: 'Multiple projects, multiple coaches, one shared squad — all in one place.',
    },
  ],
}

const SECTION_HEADINGS = {
  de: { features: 'Alles, was dein Training braucht', pricing: 'Einfache, faire Preise', pricingSub: 'Jederzeit kündbar. Kein Risiko.' },
  en: { features: 'Everything your training needs', pricing: 'Simple, Fair Pricing', pricingSub: 'Cancel anytime. No risk.' },
}

function plans(lang: MarketingLang) {
  return lang === 'de'
    ? [
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
    : [
        {
          name: 'Free',
          price: '€0',
          period: '',
          description: 'To try it out and for small teams.',
          features: [
            `${FREE_TIER_LIMITS.maxProjects} project${FREE_TIER_LIMITS.maxProjects === 1 ? '' : 's'}`,
            `${FREE_TIER_LIMITS.maxFrames} frames per project`,
            `Export up to ${FREE_TIER_LIMITS.maxExportPixelRatio}x resolution`,
            'All editor tools',
          ],
          cta: 'Start for free',
          highlighted: false,
        },
        {
          name: 'Pro',
          price: '€4.99',
          period: '/ month',
          description: "For clubs and coaches who don't want limits.",
          features: [
            'Unlimited projects',
            'Unlimited frames per project',
            `Export up to ${PRO_TIER_LIMITS.maxExportPixelRatio}x resolution`,
            'All editor tools',
            'Priority support',
          ],
          cta: 'Go Pro',
          highlighted: true,
        },
      ]
}

const POPULAR_BADGE = { de: 'BELIEBT', en: 'POPULAR' }

export function LandingPage() {
  const [lang, setLang] = useState<MarketingLang>(getStoredLang)

  function handleLangChange(next: MarketingLang) {
    setLang(next)
    storeLang(next)
  }

  const nav = NAV[lang]
  const hero = HERO[lang]
  const headings = SECTION_HEADINGS[lang]

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
              {nav.features}
            </a>
            <a href="#pricing" className="hover:text-white">
              {nav.pricing}
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
            <div className="flex items-center rounded-md border border-white/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleLangChange('de')}
                aria-pressed={lang === 'de'}
                className={`rounded-l-md px-2 py-1 transition-colors ${
                  lang === 'de' ? 'bg-brand-yellow text-brand-blue-dark' : 'text-white/60 hover:text-white'
                }`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                aria-pressed={lang === 'en'}
                className={`rounded-r-md px-2 py-1 transition-colors ${
                  lang === 'en' ? 'bg-brand-yellow text-brand-blue-dark' : 'text-white/60 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
            <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white">
              {nav.login}
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-blue-dark transition-colors hover:brightness-105"
            >
              {nav.signup}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue to-brand-blue-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <span className="rounded-full border border-brand-gold/50 bg-brand-gold/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-gold">
            9011 SOCCER
          </span>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{hero.title}</h1>
          <p className="max-w-xl text-lg text-white/80">{hero.text}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="rounded-lg bg-brand-yellow px-6 py-3 text-sm font-semibold text-brand-blue-dark shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]"
            >
              {hero.ctaPrimary}
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {hero.ctaSecondary}
            </a>
          </div>

          <div className="mt-6 w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/30 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </div>
            <img src="/marketing/hero-formation.svg" alt={hero.imageAlt} className="w-full" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">{headings.features}</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES[lang].map((f) => (
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{headings.pricing}</h2>
          <p className="mt-2 text-sm text-white/50">{headings.pricingSub}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {plans(lang).map((plan) => (
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
                  {POPULAR_BADGE[lang]}
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

      <MarketingFooter lang={lang} />
    </div>
  )
}
