import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import {
  getApiFootballFixtures,
  searchApiFootballTeams,
  type ApiFootballFixture,
  type ApiFootballTeam,
} from '../../../lib/supabase/apiFootball'

/** Admin-only: search a real team, pick one of its recent/upcoming
 * fixtures, and import both squads (home + away) in one go — used to drop
 * two recognizable pro rosters onto the board for promo videos without
 * having to search each club separately. Actual import is done by the
 * caller via onImport, which already has the org id in scope. */
export function ApiFootballFixtureImportDialog({
  onCancel,
  onImport,
}: {
  onCancel: () => void
  onImport: (fixture: ApiFootballFixture, onProgress: (done: number, total: number) => void) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState<ApiFootballTeam[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<ApiFootballTeam | null>(null)
  const [fixtures, setFixtures] = useState<ApiFootballFixture[]>([])
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false)
  const [importingFixtureId, setImportingFixtureId] = useState<number | null>(null)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    try {
      setTeams(await searchApiFootballTeams(query.trim()))
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiFootballFixtureDialog.searchError'))
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSelectTeam(team: ApiFootballTeam) {
    setSelectedTeam(team)
    setIsLoadingFixtures(true)
    setError(null)
    try {
      setFixtures(await getApiFootballFixtures(team.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiFootballFixtureDialog.fixturesError'))
    } finally {
      setIsLoadingFixtures(false)
    }
  }

  async function handleImport(fixture: ApiFootballFixture) {
    setImportingFixtureId(fixture.id)
    setImportProgress({ done: 0, total: 0 })
    setError(null)
    try {
      await onImport(fixture, (done, total) => setImportProgress({ done, total }))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiFootballFixtureDialog.importError'))
      setImportingFixtureId(null)
      setImportProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{t('apiFootballFixtureDialog.title')}</h2>
          <button type="button" onClick={onCancel} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {!selectedTeam ? (
          <>
            <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('apiFootballFixtureDialog.searchPlaceholder')}
                className="flex-1 rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
              />
              <Button type="submit" loading={isSearching} disabled={!query.trim()}>
                {t('apiFootballFixtureDialog.searchButton')}
              </Button>
            </form>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex flex-col gap-2 overflow-y-auto">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => void handleSelectTeam(team)}
                  className="flex items-center gap-3 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3 text-left hover:border-violet-accent/60"
                >
                  <img src={team.logoUrl} alt="" className="h-8 w-8 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{team.name}</p>
                    {team.country && <p className="text-xs text-white/40">{team.country}</p>}
                  </div>
                </button>
              ))}
              {hasSearched && !isSearching && teams.length === 0 && (
                <p className="text-sm text-white/40">{t('apiFootballFixtureDialog.noResults')}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img src={selectedTeam.logoUrl} alt="" className="h-8 w-8 object-contain" />
                <span className="text-sm font-medium text-white">{selectedTeam.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null)
                  setFixtures([])
                }}
                className="text-xs text-white/40 hover:text-white/70"
              >
                {t('apiFootballFixtureDialog.backToSearch')}
              </button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {isLoadingFixtures ? (
              <p className="text-sm text-white/40">{t('apiFootballFixtureDialog.loadingFixtures')}</p>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {fixtures.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-md bg-pitch-800/40 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-white/40">
                        {new Date(f.date).toLocaleDateString()} · {f.leagueName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white">
                        <img src={f.home.logoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                        <span className="truncate">{f.home.name}</span>
                        <span className="text-white/30">–</span>
                        <img src={f.away.logoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                        <span className="truncate">{f.away.name}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      loading={importingFixtureId === f.id}
                      disabled={importingFixtureId !== null}
                      onClick={() => void handleImport(f)}
                      className="shrink-0"
                    >
                      {importingFixtureId === f.id && importProgress && importProgress.total > 0
                        ? t('apiFootballFixtureDialog.importProgress', importProgress)
                        : t('apiFootballFixtureDialog.importButton')}
                    </Button>
                  </div>
                ))}
                {!isLoadingFixtures && fixtures.length === 0 && (
                  <p className="text-sm text-white/40">{t('apiFootballFixtureDialog.noFixtures')}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
