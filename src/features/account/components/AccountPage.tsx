import { type FormEvent, useState } from 'react'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../../auth/store/authStore'

export function AccountPage() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const organization = useAuthStore((s) => s.organization)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const updateProfileName = useAuthStore((s) => s.updateProfileName)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault()
    setNameError(null)
    setNameMessage(null)
    setNameSaving(true)
    const { error } = await updateProfileName(fullName)
    setNameSaving(false)
    if (error) {
      setNameError(error)
      return
    }
    setNameMessage('Gespeichert.')
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordError('Mindestens 6 Zeichen.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein.')
      return
    }
    setPasswordSaving(true)
    const { error } = await updatePassword(newPassword)
    setPasswordSaving(false)
    if (error) {
      setPasswordError(error)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Passwort geändert.')
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />

      <main className="mx-auto max-w-lg p-8">
        <h1 className="mb-6 text-lg font-semibold text-white">Konto</h1>

        <section className="mb-8 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Profil
          </h2>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-white/60">Email</span>
            <span className="text-white">{session?.user.email}</span>
          </div>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-white/60">Organisation</span>
            <span className="text-white">{organization?.name}</span>
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleNameSubmit}>
            <Input
              label="Dein Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {nameError && <p className="text-sm text-red-400">{nameError}</p>}
            {nameMessage && <p className="text-sm text-green-400">{nameMessage}</p>}
            <Button type="submit" variant="secondary" loading={nameSaving} className="self-start">
              Namen speichern
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Passwort ändern
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handlePasswordSubmit}>
            <Input
              label="Neues Passwort"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Neues Passwort bestätigen"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-400">{passwordMessage}</p>}
            <Button type="submit" loading={passwordSaving} className="self-start">
              Passwort ändern
            </Button>
          </form>
        </section>
      </main>
    </div>
  )
}
