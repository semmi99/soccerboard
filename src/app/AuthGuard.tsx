import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'

function FullScreenSpinner() {
  return (
    <div className="flex h-full items-center justify-center bg-pitch-950">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'signed_out') return <Navigate to="/login" replace />
  return <>{children}</>
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'signed_in') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
