import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/components/LoginPage'
import { SignupPage } from '../features/auth/components/SignupPage'
import { AuthGuard, GuestGuard } from './AuthGuard'

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-pitch-950 text-2xl text-white/60">
      {label}
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
            <Placeholder label="Dashboard" />
          </AuthGuard>
        }
      />
      <Route
        path="/editor/:projectId"
        element={
          <AuthGuard>
            <Placeholder label="Editor" />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
