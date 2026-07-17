import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { POSITIONS, STRONG_FOOT_OPTIONS } from '../constants'
import type { Player, PlayerFormValues } from '../../../lib/supabase/squad'

const selectClass =
  'rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent'

function toFormValues(teamId: string, player?: Player): PlayerFormValues {
  return {
    teamId,
    firstName: player?.first_name ?? '',
    lastName: player?.last_name ?? '',
    jerseyNumber: player?.jersey_number ?? null,
    position: player?.position ?? '',
    secondaryPosition: player?.secondary_position ?? '',
    strongFoot: player?.strong_foot ?? '',
    birthDate: player?.birth_date ?? '',
    nationality: player?.nationality ?? '',
    phone: player?.phone ?? '',
    email: player?.email ?? '',
    notes: player?.notes ?? '',
  }
}

export function PlayerFormDialog({
  teamId,
  player,
  onCancel,
  onSubmit,
}: {
  teamId: string
  player?: Player
  onCancel: () => void
  onSubmit: (values: PlayerFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<PlayerFormValues>(toFormValues(teamId, player))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof PlayerFormValues>(key: K, value: PlayerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-sm font-semibold text-white">
          {player ? 'Spieler bearbeiten' : 'Spieler hinzufügen'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Vorname"
            required
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
          />
          <Input
            label="Nachname"
            required
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
          />
          <Input
            label="Rückennummer"
            type="number"
            min={1}
            max={99}
            value={values.jerseyNumber ?? ''}
            onChange={(e) => set('jerseyNumber', e.target.value ? Number(e.target.value) : null)}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Starker Fuß</span>
            <select
              className={selectClass}
              value={values.strongFoot}
              onChange={(e) => set('strongFoot', e.target.value)}
            >
              <option value="">–</option>
              {STRONG_FOOT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Position</span>
            <select
              className={selectClass}
              value={values.position}
              onChange={(e) => set('position', e.target.value)}
            >
              <option value="">–</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Nebenposition</span>
            <select
              className={selectClass}
              value={values.secondaryPosition}
              onChange={(e) => set('secondaryPosition', e.target.value)}
            >
              <option value="">–</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Geburtsdatum"
            type="date"
            value={values.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
          <Input
            label="Nationalität"
            value={values.nationality}
            onChange={(e) => set('nationality', e.target.value)}
          />
          <Input
            label="Telefon"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>

        <label className="mt-3 flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/70">Notizen</span>
          <textarea
            rows={2}
            className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button type="submit" loading={isSaving}>
            Speichern
          </Button>
        </div>
      </form>
    </div>
  )
}
