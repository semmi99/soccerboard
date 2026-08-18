import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import {
  getFootballDataSquad,
  listFootballDataCompetitions,
  listFootballDataTeams,
  type FootballDataCompetition,
} from '../../../lib/supabase/footballData'
import type { ApiFootballPlayer, ApiFootballTeam } from '../../../lib/supabase/apiFootball'

/** Admin-only: browse a competition, pick a team, preview its squad, import.
 * football-data.org has no free-text team search — unlike the API-Football
 * dialog, the flow here is competition → team rather than a search box. */
export function FootballDataImportDialog({
  onCancel,
  onImport,
}: {
  onCancel: () => void
  onImport: (team: ApiFootballTeam, players: ApiFootballPlayer[]) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [competitions, setCompetitions] = useState<FootballDataCompetition[]>([])
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true)
  const [selectedCompetition, setSelectedCompetition] = useState<FootballDataCompetition | null>(null)
  const [teams, setTeams] = useState<ApiFootballTeam[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<ApiFootballTeam | null>(null)
  const [players, setPlayers] = useState<ApiFootballPlayer[]>([])
  const [isLoadingSquad, setIsLoadingSquad] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFootballDataCompetitions()
      .then(setCompetitions)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('footballDataDialog.competitionsError')))
      .finally(() => setIsLoadingCompetitions(false))
  }, [t])

  async function handleSelectCompetition(competition: FootballDataCompetition) {
    setSelectedCompetition(competition)
    setIsLoadingTeams(true)
    setError(null)
    try {
      setTeams(await listFootballDataTeams(competition.code))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('footballDataDialog.teamsError'))
    } finally {
      setIsLoadingTeams(false)
    }
  }

  async function handleSelectTeam(team: ApiFootballTeam) {
    setSelectedTeam(team)
    setIsLoadingSquad(true)
    setError(null)
    try {
      const squad = await getFootballDataSquad(team.id)
      setPlayers(squad.players)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('footballDataDialog.squadError'))
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
      setError(err instanceof Error ? err.message : t('footballDataDialog.importError'))
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{t('footballDataDialog.title')}</h2>
          <button type="button" onClick={onCancel} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!selectedCompetition ? (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {isLoadingCompetitions ? (
              <p className="text-sm text-white/40">{t('footballDataDialog.loadingCompetitions')}</p>
            ) : (
              competitions.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => void handleSelectCompetition(c)}
                  className="flex items-center gap-3 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3 text-left hover:border-violet-accent/60"
                >
                  {c.emblemUrl && <img src={c.emblemUrl} alt="" className="h-8 w-8 shrink-0 object-contain" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-white/40">{c.area}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : !selectedTeam ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-white">{selectedCompetition.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompetition(null)
                  setTeams([])
                }}
                className="text-xs text-white/40 hover:text-white/70"
              >
                {t('footballDataDialog.backToCompetitions')}
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {isLoadingTeams ? (
                <p className="text-sm text-white/40">{t('footballDataDialog.loadingTeams')}</p>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => void handleSelectTeam(team)}
                    className="flex items-center gap-3 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3 text-left hover:border-violet-accent/60"
                  >
                    {team.logoUrl && <img src={team.logoUrl} alt="" className="h-8 w-8 shrink-0 object-contain" />}
                    <p className="truncate text-sm font-medium text-white">{team.name}</p>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedTeam.logoUrl && <img src={selectedTeam.logoUrl} alt="" className="h-8 w-8 object-contain" />}
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
                {t('footballDataDialog.backToTeams')}
              </button>
            </div>

            {isLoadingSquad ? (
              <p className="text-sm text-white/40">{t('footballDataDialog.loadingSquad')}</p>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {players.map((p) => (
                  <div key={p.apiPlayerId} className="flex items-center gap-3 rounded-md bg-pitch-800/40 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{p.name}</span>
                    <span className="shrink-0 text-xs text-white/40">{p.position}</span>
                    {p.number != null && <span className="shrink-0 text-xs font-semibold text-white/60">#{p.number}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={isImporting}>
                {t('common:actions.cancel')}
              </Button>
              <Button type="button" loading={isImporting} disabled={players.length === 0} onClick={() => void handleImport()}>
                {t('footballDataDialog.importCount', { count: players.length })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
