import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import {
  getApiFootballSquad,
  searchApiFootballTeams,
  type ApiFootballPlayer,
  type ApiFootballTeam,
} from '../../../lib/supabase/apiFootball'

/** Admin-only: search a real pro team on API-Football and preview its
 * squad before importing — used to drop a recognizable roster onto the
 * board for promo videos. Actual import (create team + players) is done
 * by the caller via onImport, which already has the org id in scope. */
export function ApiFootballImportDialog({
  onCancel,
  onImport,
}: {
  onCancel: () => void
  onImport: (team: ApiFootballTeam, players: ApiFootballPlayer[]) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState<ApiFootballTeam[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<ApiFootballTeam | null>(null)
  const [players, setPlayers] = useState<ApiFootballPlayer[]>([])
  const [isLoadingSquad, setIsLoadingSquad] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
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
      setError(err instanceof Error ? err.message : t('apiFootballDialog.searchError'))
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSelectTeam(team: ApiFootballTeam) {
    setSelectedTeam(team)
    setIsLoadingSquad(true)
    setError(null)
    try {
      setPlayers(await getApiFootballSquad(team.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiFootballDialog.squadError'))
    } finally {
      setIsLoadingSquad(false)
    }
  }

  async function handleImport() {
    if (!selectedTeam) return
    setIsImporting(true)
    setError(null)
    try {
      await onImport(selectedTeam, players)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiFootballDialog.importError'))
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{t('apiFootballDialog.title')}</h2>
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
                placeholder={t('apiFootballDialog.searchPlaceholder')}
                className="flex-1 rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
              />
              <Button type="submit" loading={isSearching} disabled={!query.trim()}>
                {t('apiFootballDialog.searchButton')}
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
                    <p className="text-xs text-white/40">{team.country}</p>
                  </div>
                </button>
              ))}
              {hasSearched && !isSearching && teams.length === 0 && (
                <p className="text-sm text-white/40">{t('apiFootballDialog.noResults')}</p>
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
                  setPlayers([])
                }}
                className="text-xs text-white/40 hover:text-white/70"
              >
                {t('apiFootballDialog.backToSearch')}
              </button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {isLoadingSquad ? (
              <p className="text-sm text-white/40">{t('apiFootballDialog.loadingSquad')}</p>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {players.map((p) => (
                  <div
                    key={p.apiPlayerId}
                    className="flex items-center gap-3 rounded-md bg-pitch-800/40 px-3 py-1.5"
                  >
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-pitch-700" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{p.name}</span>
                    <span className="shrink-0 text-xs text-white/40">{p.position}</span>
                    {p.number != null && (
                      <span className="shrink-0 text-xs font-semibold text-white/60">#{p.number}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isImporting}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="button"
                loading={isImporting}
                disabled={players.length === 0}
                onClick={() => void handleImport()}
              >
                {t('apiFootballDialog.importCount', { count: players.length })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
