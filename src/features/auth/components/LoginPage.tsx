import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout title={t('login.title')} subtitle={t('login.subtitle')}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label={t('login.emailLabel')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t('login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="brand" loading={loading} className="mt-2 w-full">
          {t('login.submit')}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-white/50 hover:text-white/80 hover:underline">
          {t('login.forgotPasswordLink')}
        </Link>
      </p>
      <p className="mt-5 text-center text-sm text-white/60">
        {t('login.noAccount')}{' '}
        <Link to="/signup" className="font-medium text-brand-yellow hover:underline">
          {t('login.signupLink')}
        </Link>
      </p>
    </AuthLayout>
  )
}
