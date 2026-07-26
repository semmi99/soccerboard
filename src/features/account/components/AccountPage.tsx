import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useAuthStore } from '../../auth/store/authStore'
import { applyTheme, getStoredTheme, type AppTheme } from '../../../lib/theme'
import { openBillingPortal, startCheckout } from '../../../lib/supabase/billing'

export function AccountPage() {
  const { t, i18n } = useTranslation('account')

  const THEME_OPTIONS: { value: AppTheme; label: string; swatch: string }[] = [
    { value: 'brand', label: t('appearance.brand'), swatch: '#0f3d59' },
    { value: 'dark', label: t('appearance.dark'), swatch: '#121212' },
  ]

  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const organization = useAuthStore((s) => s.organization)
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const updateProfileName = useAuthStore((s) => s.updateProfileName)

  const [theme, setTheme] = useState<AppTheme>(getStoredTheme)

  function handleThemeChange(next: AppTheme) {
    setTheme(next)
    applyTheme(next)
  }

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  async function handleUpgrade() {
    setBillingError(null)
    setBillingLoading(true)
    try {
      const url = await startCheckout()
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : t('subscription.checkoutFailed'))
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setBillingError(null)
    setBillingLoading(true)
    try {
      const url = await openBillingPortal()
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : t('subscription.openFailed'))
      setBillingLoading(false)
    }
  }

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
    setNameMessage(t('profile.saved'))
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordError(t('password.tooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('password.mismatch'))
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
    setPasswordMessage(t('password.changed'))
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />

      <main className="mx-auto max-w-lg p-8">
        <h1 className="mb-6 text-lg font-semibold text-white">{t('title')}</h1>

        <section className="mb-8 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('profile.title')}
          </h2>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-white/60">{t('profile.email')}</span>
            <span className="text-white">{session?.user.email}</span>
          </div>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-white/60">{t('profile.organization')}</span>
            <span className="text-white">{organization?.name}</span>
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleNameSubmit}>
            <Input
              label={t('profile.nameLabel')}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {nameError && <p className="text-sm text-red-400">{nameError}</p>}
            {nameMessage && <p className="text-sm text-green-400">{nameMessage}</p>}
            <Button type="submit" variant="secondary" loading={nameSaving} className="self-start">
              {t('profile.saveName')}
            </Button>
          </form>
        </section>

        <section className="mb-8 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('subscription.title')}
          </h2>
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-white/60">{t('subscription.currentPlan')}</span>
            <span className="text-white">
              {organization?.subscription_tier === 'pro' ? t('subscription.tierPaid') : t('subscription.tierFree')}
              {organization?.subscription_status && (
                <span className="ml-2 text-xs text-white/40">
                  (
                  {t(`subscription.status.${organization.subscription_status}`, {
                    defaultValue: organization.subscription_status,
                  })}
                  )
                </span>
              )}
            </span>
          </div>
          {organization?.subscription_valid_until && (
            <div className="mb-4 flex flex-col gap-1 text-sm">
              <span className="font-medium text-white/60">{t('subscription.paidUntil')}</span>
              <span className="text-white">
                {new Date(organization.subscription_valid_until).toLocaleDateString(i18n.language)}
              </span>
            </div>
          )}
          {billingError && <p className="mb-3 text-sm text-red-400">{billingError}</p>}
          {organization?.stripe_customer_id ? (
            <Button variant="secondary" loading={billingLoading} onClick={() => void handleManageBilling()}>
              {t('subscription.manage')}
            </Button>
          ) : (
            <Button loading={billingLoading} onClick={() => void handleUpgrade()}>
              {t('subscription.becomeCoach')}
            </Button>
          )}
        </section>

        <section className="mb-8 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('appearance.title')}
          </h2>
          <div className="flex gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleThemeChange(opt.value)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-xs transition-colors ${
                  theme === opt.value
                    ? 'border-violet-accent bg-violet-accent/10 text-white'
                    : 'border-pitch-600 text-white/60 hover:border-pitch-500'
                }`}
              >
                <span
                  className="h-8 w-full rounded-md border border-white/10"
                  style={{ backgroundColor: opt.swatch }}
                />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/40">{t('appearance.note')}</p>
        </section>

        <section className="rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('password.title')}
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handlePasswordSubmit}>
            <Input
              label={t('password.newLabel')}
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label={t('password.confirmLabel')}
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-400">{passwordMessage}</p>}
            <Button type="submit" loading={passwordSaving} className="self-start">
              {t('password.submit')}
            </Button>
          </form>
        </section>
      </main>
    </div>
  )
}
