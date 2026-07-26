import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'

interface ParsedEntry {
  firstName: string
  lastName: string
  jerseyNumber: number | null
}

function parseLines(text: string): ParsedEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/)
      let jerseyNumber: number | null = null
      if (/^\d+$/.test(parts[0]!)) {
        jerseyNumber = Number(parts.shift())
      }
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ')
      return { firstName, lastName, jerseyNumber }
    })
    .filter((e) => e.firstName)
}

export function BulkAddPlayersDialog({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (entries: ParsedEntry[]) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entries = parseLines(text)

  async function handleSubmit() {
    if (entries.length === 0) return
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit(entries)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-sm font-semibold text-white">{t('bulkAddDialog.title')}</h2>
        <p className="mb-3 text-xs text-white/50">
          {t('bulkAddDialog.descriptionBefore')}{' '}
          <span className="text-white/70">{t('bulkAddDialog.descriptionCode')}</span>.{' '}
          {t('bulkAddDialog.descriptionAfter')}
        </p>
        <textarea
          rows={8}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('bulkAddDialog.placeholder')}
          className="w-full rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 font-mono text-sm text-white outline-none focus:border-violet-accent"
        />
        <p className="mt-2 text-xs text-white/40">
          {entries.length > 0
            ? t('bulkAddDialog.recognizedCount', { count: entries.length })
            : t('bulkAddDialog.noneRecognized')}
        </p>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="button"
            loading={isSaving}
            disabled={entries.length === 0}
            onClick={() => void handleSubmit()}
          >
            {entries.length > 0
              ? t('bulkAddDialog.createCount', { count: entries.length })
              : t('bulkAddDialog.createDefault')}
          </Button>
        </div>
      </div>
    </div>
  )
}
