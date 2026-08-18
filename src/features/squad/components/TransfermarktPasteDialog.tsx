import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { parseTransfermarktPaste, type ParsedTransfermarktPlayer } from '../parseTransfermarktPaste'

/** Admin-only, no API/scraping involved: the admin opens a club's Kader
 * page on transfermarkt.at/.de themselves, selects the squad table, copies
 * it, and pastes it here. Parsing anchors on Transfermarkt's own fixed
 * German position labels (see parseTransfermarktPaste) rather than exact
 * column positions, so it tolerates the "Kompakt" vs "Erweitert" table
 * view and minor whitespace differences. */
export function TransfermarktPasteDialog({
  onCancel,
  onImport,
}: {
  onCancel: () => void
  onImport: (teamName: string, entries: ParsedTransfermarktPlayer[]) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [teamName, setTeamName] = useState('')
  const [text, setText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entries = parseTransfermarktPaste(text)

  async function handleImport() {
    if (!teamName.trim() || entries.length === 0) return
    setIsImporting(true)
    setError(null)
    try {
      await onImport(teamName.trim(), entries)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfermarktDialog.importError'))
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-3 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{t('transfermarktDialog.title')}</h2>
          <button type="button" onClick={onCancel} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        <p className="text-xs text-white/50">{t('transfermarktDialog.description')}</p>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/70">{t('transfermarktDialog.teamNameLabel')}</span>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t('transfermarktDialog.teamNamePlaceholder')}
            className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
          />
        </label>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('transfermarktDialog.pastePlaceholder')}
          className="w-full rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-violet-accent"
        />

        {entries.length > 0 && (
          <div className="flex flex-col gap-1 overflow-y-auto rounded-lg border border-pitch-700 bg-pitch-800/40 p-2">
            {entries.map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-1 py-0.5 text-xs text-white/80">
                <span className="w-6 shrink-0 text-center font-semibold text-white/50">{p.jerseyNumber ?? '–'}</span>
                <span className="min-w-0 flex-1 truncate">
                  {p.firstName} {p.lastName}
                </span>
                <span className="shrink-0 text-white/40">{p.position ?? '–'}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-white/40">
          {entries.length > 0
            ? t('transfermarktDialog.recognizedCount', { count: entries.length })
            : t('transfermarktDialog.noneRecognized')}
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isImporting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="button"
            loading={isImporting}
            disabled={!teamName.trim() || entries.length === 0}
            onClick={() => void handleImport()}
          >
            {t('transfermarktDialog.importCount', { count: entries.length })}
          </Button>
        </div>
      </div>
    </div>
  )
}
