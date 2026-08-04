import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const resetPasswordForEmail = useAuthStore((s) => s.resetPasswordForEmail)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  // Always shown on submit, regardless of whether the email actually
  // matches an account — telling the user "no account with that email"
  // would let anyone probe which addresses are registered.
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await resetPasswordForEmail(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout title={t('forgotPassword.title')} subtitle={t('forgotPassword.subtitle')}>
      {sent ? (
        <p className="text-sm text-white/70">{t('forgotPassword.successMessage')}</p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label={t('login.emailLabel')}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="brand" loading={loading} className="mt-2 w-full">
            {t('forgotPassword.submit')}
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-white/60">
        <Link to="/login" className="font-medium text-brand-yellow hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </AuthLayout>
  )
}
