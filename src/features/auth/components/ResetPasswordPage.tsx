import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

// Deliberately NOT wrapped in AuthGuard/GuestGuard: the recovery link lands
// here with status still 'loading' while Supabase parses the token out of
// the URL and establishes a short-lived session (picked up by the same
// onAuthStateChange listener every other sign-in goes through) — a normal
// guard would either bounce a signed-out visitor to "/" before that
// finishes, or (once signed in) redirect straight past this page to the
// dashboard without ever letting them set the new password.
export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  if (status === 'loading') {
    return (
      <AuthLayout title={t('resetPassword.title')} subtitle={t('resetPassword.subtitle')}>
        <div className="flex justify-center py-4">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-yellow" />
        </div>
      </AuthLayout>
    )
  }

  if (status === 'signed_out') {
    return (
      <AuthLayout title={t('resetPassword.title')} subtitle={t('resetPassword.subtitle')}>
        <p className="text-sm text-red-400">{t('resetPassword.invalidLink')}</p>
        <p className="mt-5 text-center text-sm text-white/60">
          <Link to="/forgot-password" className="font-medium text-brand-yellow hover:underline">
            {t('resetPassword.requestNewLink')}
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('resetPassword.title')} subtitle={t('resetPassword.subtitle')}>
      <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
        <Input
          label={t('resetPassword.newPasswordLabel')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="brand" loading={loading} className="mt-2 w-full">
          {t('resetPassword.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
