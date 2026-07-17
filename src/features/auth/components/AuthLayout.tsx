import type { ReactNode } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-pitch-950 px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.08), transparent 40%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-accent text-lg font-bold text-white">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              TacticBoard <span className="text-gold-accent">Pro</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-pitch-700 bg-pitch-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  )
}
