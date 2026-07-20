import { useEffect, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import {
  cancelInvite,
  inviteMember,
  listOrgMembers,
  listPendingInvites,
  updateMemberRole,
  type OrgInvite,
  type OrgMember,
  type OrgRole,
} from '../../../lib/supabase/admin'
import { PlatformAdminSection } from './PlatformAdminSection'

const ROLE_LABELS: Record<OrgRole, string> = {
  admin: 'Admin',
  coach: 'Trainer',
  viewer: 'Betrachter',
}

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-accent'

export function AdminPage() {
  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [members, setMembers] = useState<OrgMember[]>([])
  const [invites, setInvites] = useState<OrgInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('coach')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    setIsLoading(true)
    Promise.all([listOrgMembers(organization.id), listPendingInvites(organization.id)])
      .then(([m, i]) => {
        if (cancelled) return
        setMembers(m)
        setInvites(i)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization])

  async function handleRoleChange(memberId: string, role: OrgRole) {
    setError(null)
    try {
      const updated = await updateMemberRole(memberId, role)
      setMembers((ms) => ms.map((m) => (m.id === updated.id ? updated : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rolle konnte nicht geändert werden.')
    }
  }

  async function handleInvite() {
    if (!organization || !profile || !inviteEmail.trim()) return
    setIsInviting(true)
    setError(null)
    try {
      const invite = await inviteMember({
        orgId: organization.id,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: profile.id,
      })
      setInvites((is) => [invite, ...is])
      setInviteEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Einladung fehlgeschlagen.')
    } finally {
      setIsInviting(false)
    }
  }

  async function handleCancelInvite(id: string) {
    setError(null)
    try {
      await cancelInvite(id)
      setInvites((is) => is.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konnte nicht entfernt werden.')
    }
  }

  if (!organization || !profile) {
    return (
      <div className="flex h-full items-center justify-center bg-pitch-950">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
      </div>
    )
  }

  if (profile.role !== 'admin') {
    return (
      <div className="h-full bg-pitch-950">
        <AppHeader />
        <div className="flex flex-col items-center gap-2 py-20 text-white/50">
          <p>Diese Seite ist nur für Admins deines Teams.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-lg font-semibold text-white">Benutzerverwaltung</h1>
        <p className="mt-1 text-sm text-white/40">
          Lade Kolleg:innen zu „{organization.name}“ ein und verwalte ihre Rolle. Ein echtes
          Benutzerkonto entsteht erst, wenn die eingeladene Person sich mit genau dieser E-Mail-
          Adresse selbst registriert — sie landet dann automatisch in diesem Team statt in einem
          neuen.
        </p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <section className="mt-6 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Neu einladen</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs">
              <span className="font-medium text-white/60">E-Mail</span>
              <input
                type="email"
                className={inputClass}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="trainer@verein.de"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/60">Rolle</span>
              <select
                className={selectClass}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              >
                {(Object.keys(ROLE_LABELS) as OrgRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <Button
              onClick={() => void handleInvite()}
              loading={isInviting}
              disabled={!inviteEmail.trim()}
            >
              Einladen
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-white/40">Ausstehend</span>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-md bg-pitch-800 px-3 py-2 text-sm text-white/70"
                >
                  <span>
                    {inv.email} <span className="text-white/30">· {ROLE_LABELS[inv.role as OrgRole]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCancelInvite(inv.id)}
                    className="text-xs text-white/40 hover:text-red-400"
                  >
                    Zurückziehen
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-pitch-700 bg-pitch-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Mitglieder</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-pitch-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {m.full_name || m.email || 'Unbenannt'}
                      {m.id === profile.id && <span className="ml-2 text-xs text-white/30">(Du)</span>}
                    </p>
                    {m.full_name && m.email && (
                      <p className="truncate text-xs text-white/40">{m.email}</p>
                    )}
                  </div>
                  <select
                    className={selectClass}
                    value={m.role}
                    disabled={m.id === profile.id}
                    title={m.id === profile.id ? 'Du kannst deine eigene Rolle nicht ändern' : undefined}
                    onChange={(e) => void handleRoleChange(m.id, e.target.value as OrgRole)}
                  >
                    {(Object.keys(ROLE_LABELS) as OrgRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>

        {profile.is_platform_admin && <PlatformAdminSection />}
      </main>
    </div>
  )
}
