import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import {
  listAllOrganizations,
  listAllProfiles,
  setUserPassword,
  updateAnyProfileRole,
  updateOrgFreeOverride,
  type PlatformOrg,
  type PlatformProfile,
} from '../../../lib/supabase/platformAdmin'

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-accent'

function PasswordResetDialog({
  profile,
  onClose,
  onSet,
}: {
  profile: PlatformProfile
  onClose: () => void
  onSet: (newPassword: string) => Promise<void>
}) {
  const { t } = useTranslation(['admin', 'common'])
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (password.length < 8) {
      setError(t('passwordDialog.tooShort'))
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await onSet(password)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordDialog.failed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-white">
          {t('passwordDialog.title', { name: profile.full_name || profile.email })}
        </h2>
        <input
          type="text"
          className={`${inputClass} mt-3 w-full`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordDialog.placeholder')}
          autoFocus
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} loading={isSaving}>
            {t('passwordDialog.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PlatformAdminSection() {
  const { t } = useTranslation('admin')

  const ROLE_LABELS: Record<string, string> = {
    admin: t('platform.roles.admin'),
    coach: t('platform.roles.coach'),
    viewer: t('platform.roles.viewer'),
  }

  const [orgs, setOrgs] = useState<PlatformOrg[]>([])
  const [profiles, setProfiles] = useState<PlatformProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<PlatformProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listAllOrganizations(), listAllProfiles()])
      .then(([o, p]) => {
        if (cancelled) return
        setOrgs(o)
        setProfiles(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleFreeOverrideToggle(orgId: string, value: boolean) {
    setError(null)
    try {
      const updated = await updateOrgFreeOverride(orgId, value)
      setOrgs((os) => os.map((o) => (o.id === updated.id ? updated : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('platform.freeOverrideError'))
    }
  }

  async function handleRoleChange(profileId: string, role: string) {
    setError(null)
    try {
      const updated = await updateAnyProfileRole(profileId, role)
      setProfiles((ps) => ps.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roleChangeError'))
    }
  }

  const orgById = new Map(orgs.map((o) => [o.id, o]))

  return (
    <div className="mt-10 border-t border-pitch-700 pt-8">
      <h1 className="text-lg font-semibold text-white">{t('platform.title')}</h1>
      <p className="mt-1 text-sm text-white/40">{t('platform.subtitle')}</p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <div className="mt-6 flex justify-center py-8">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">{t('platform.orgsTitle')}</h2>
            <div className="flex flex-col gap-1.5">
              {orgs.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-pitch-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{o.name}</p>
                    <p className="text-xs text-white/40">
                      {t('platform.tierLabel', { tier: o.subscription_tier })}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      className="accent-violet-accent"
                      checked={o.free_override}
                      onChange={(e) => void handleFreeOverrideToggle(o.id, e.target.checked)}
                    />
                    {t('platform.freeOverrideLabel')}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">{t('platform.usersTitle')}</h2>
            <div className="flex flex-col gap-1.5">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-pitch-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {p.full_name || p.email || t('membersSection.unnamed')}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {p.email} · {orgById.get(p.org_id)?.name ?? '–'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      className={selectClass}
                      value={p.role}
                      onChange={(e) => void handleRoleChange(p.id, e.target.value)}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Button variant="secondary" onClick={() => setPasswordTarget(p)}>
                      {t('platform.setPassword')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {passwordTarget && (
        <PasswordResetDialog
          profile={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSet={(newPassword) => setUserPassword(passwordTarget.id, newPassword)}
        />
      )}
    </div>
  )
}
