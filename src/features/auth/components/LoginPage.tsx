import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
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
    <AuthLayout title="Willkommen zurück" subtitle="Melde dich bei deinem Verein an">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Passwort"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="brand" loading={loading} className="mt-2 w-full">
          Anmelden
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-white/60">
        Noch kein Konto?{' '}
        <Link to="/signup" className="font-medium text-brand-yellow hover:underline">
          Registrieren
        </Link>
      </p>
    </AuthLayout>
  )
}
