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
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-brand-blue to-brand-blue-dark px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,225,0,0.12), transparent 40%), radial-gradient(circle at 80% 70%, rgba(242,167,59,0.12), transparent 40%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-blue-dark">
              9011
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              TacticBoard <span className="text-brand-yellow">Pro</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-[#0a0f18]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  )
}
