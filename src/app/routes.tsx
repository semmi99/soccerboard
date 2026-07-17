import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/components/LoginPage'
import { SignupPage } from '../features/auth/components/SignupPage'
import { EditorPage } from '../features/editor/components/EditorPage'
import { DashboardPage } from '../features/projects/components/DashboardPage'
import { SquadPage } from '../features/squad/components/SquadPage'
import { AuthGuard, GuestGuard } from './AuthGuard'

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
            <DashboardPage />
          </AuthGuard>
        }
      />
      <Route
        path="/squad"
        element={
          <AuthGuard>
            <SquadPage />
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
