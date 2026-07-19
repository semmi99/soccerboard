import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../features/auth/components/LoginPage'
import { SignupPage } from '../features/auth/components/SignupPage'
import { EditorPage } from '../features/editor/components/EditorPage'
import { DashboardPage } from '../features/projects/components/DashboardPage'
import { SquadPage } from '../features/squad/components/SquadPage'
import { FormationsPage } from '../features/formations/components/FormationsPage'
import { LandingPage } from '../features/marketing/components/LandingPage'
import { AccountPage } from '../features/account/components/AccountPage'
import { ImpressumPage } from '../features/legal/components/ImpressumPage'
import { AgbPage } from '../features/legal/components/AgbPage'
import { DatenschutzPage } from '../features/legal/components/DatenschutzPage'
import { KontaktPage } from '../features/legal/components/KontaktPage'
import { AuthGuard, GuestGuard } from './AuthGuard'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestGuard>
            <LandingPage />
          </GuestGuard>
        }
      />
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
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/agb" element={<AgbPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
      <Route path="/kontakt" element={<KontaktPage />} />
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
        path="/formations"
        element={
          <AuthGuard>
            <FormationsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/account"
        element={
          <AuthGuard>
            <AccountPage />
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
