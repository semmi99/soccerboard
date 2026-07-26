import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  onSubmit: (values: PlayerFormValues, photoFile: File | null) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [values, setValues] = useState<PlayerFormValues>(toFormValues(teamId, player))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : (player?.photo_url ?? null)),
    [photoFile, player?.photo_url],
  )

  function set<K extends keyof PlayerFormValues>(key: K, value: PlayerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit(values, photoFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'))
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
          {player ? t('playerForm.titleEdit') : t('playerForm.titleNew')}
        </h2>

        <div className="mb-4 flex items-center gap-3">
          {photoPreviewUrl ? (
            <img
              src={photoPreviewUrl}
              alt=""
              className="h-14 w-14 rounded-full border border-pitch-600 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pitch-600 bg-pitch-800 text-xs text-white/40">
              {t('playerForm.photoPlaceholder')}
            </div>
          )}
          <label className="text-sm">
            <span className="cursor-pointer rounded-lg border border-pitch-600 bg-pitch-800 px-3 py-2 text-white/70 hover:text-white">
              {t('playerForm.choosePhoto')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('playerForm.firstName')}
            required
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
          />
          <Input
            label={t('playerForm.lastName')}
            required
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
          />
          <Input
            label={t('playerForm.jerseyNumber')}
            type="number"
            min={1}
            max={99}
            value={values.jerseyNumber ?? ''}
            onChange={(e) => set('jerseyNumber', e.target.value ? Number(e.target.value) : null)}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('playerForm.strongFoot')}</span>
            <select
              className={selectClass}
              value={values.strongFoot}
              onChange={(e) => set('strongFoot', e.target.value)}
            >
              <option value="">–</option>
              {STRONG_FOOT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {t(`feet.${f}`, { defaultValue: f })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('playerForm.position')}</span>
            <select
              className={selectClass}
              value={values.position}
              onChange={(e) => set('position', e.target.value)}
            >
              <option value="">–</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {t(`positions.${p}`, { defaultValue: p })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('playerForm.secondaryPosition')}</span>
            <select
              className={selectClass}
              value={values.secondaryPosition}
              onChange={(e) => set('secondaryPosition', e.target.value)}
            >
              <option value="">–</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {t(`positions.${p}`, { defaultValue: p })}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t('playerForm.birthDate')}
            type="date"
            value={values.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
          <Input
            label={t('playerForm.nationality')}
            value={values.nationality}
            onChange={(e) => set('nationality', e.target.value)}
          />
          <Input
            label={t('playerForm.phone')}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <Input
            label={t('playerForm.email')}
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>

        <label className="mt-3 flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/70">{t('playerForm.notes')}</span>
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
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" loading={isSaving}>
            {t('common:actions.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
