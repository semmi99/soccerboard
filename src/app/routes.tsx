import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/components/LoginPage'
import { SignupPage } from '../features/auth/components/SignupPage'
import { EditorPage } from '../features/editor/components/EditorPage'
import { useAuthStore } from '../features/auth/store/authStore'
import { AuthGuard, GuestGuard } from './AuthGuard'

function DashboardPlaceholder() {
  const signOut = useAuthStore((s) => s.signOut)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-pitch-950 text-white/60">
      <p className="text-2xl">Dashboard (folgt in Task 8)</p>
      <Link
        to="/editor/new"
        className="rounded-lg bg-violet-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-accent-bright"
      >
        Neues Projekt öffnen
      </Link>
      <button type="button" onClick={() => void signOut()} className="text-xs underline">
        Abmelden
      </button>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestGuard>
            <SignupPage />
          </GuestGuard>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <DashboardPlaceholder />
          </AuthGuard>
        }
      />
      <Route
        path="/editor/:projectId"
        element={
          <AuthGuard>
            <EditorPage />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
