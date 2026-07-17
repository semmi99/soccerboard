import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((s) => s.signUp)
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error, needsEmailConfirmation } = await signUp(email, password, fullName, orgName)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    if (needsEmailConfirmation) {
      setConfirmationSent(true)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  if (confirmationSent) {
    return (
      <AuthLayout title="Fast geschafft" subtitle="Bestätige deine Email-Adresse">
        <p className="text-sm text-white/70">
          Wir haben dir einen Bestätigungslink an <strong className="text-white">{email}</strong>{' '}
          geschickt. Klicke auf den Link, um dein Konto zu aktivieren und dich anzumelden.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block text-sm font-medium text-violet-accent-bright hover:underline"
        >
          Zurück zum Login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Konto erstellen" subtitle="Richte deinen Verein in TacticBoard Pro ein">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Dein Name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Verein / Team (optional)"
          type="text"
          placeholder="z. B. Rapid Kapfenberg U18"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
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
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Konto erstellen
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-white/50">
        Schon registriert?{' '}
        <Link to="/login" className="font-medium text-violet-accent-bright hover:underline">
          Anmelden
        </Link>
      </p>
    </AuthLayout>
  )
}
