import { useEffect, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { listTeams, listPlayers, type Player, type Team } from '../../../lib/supabase/squad'
import { listFormations, type Formation } from '../../../lib/supabase/formations'
import { PRESET_FORMATIONS } from '../../formations/presets'
import { Button } from '../../../components/ui/Button'

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

export function TeamSquadPanel() {
  const organization = useAuthStore((s) => s.organization)
  const teamId = useEditorStore((s) => s.teamId)
  const setTeamId = useEditorStore((s) => s.setTeamId)
  const pendingPlayer = useEditorStore((s) => s.pendingPlayer)
  const setPendingPlayer = useEditorStore((s) => s.setPendingPlayer)
  const setTool = useEditorStore((s) => s.setTool)
  const applyFormationToFrame = useEditorStore((s) => s.applyFormationToFrame)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)

  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [customFormations, setCustomFormations] = useState<Formation[]>([])
  const [selectedFormationKey, setSelectedFormationKey] = useState<string>('')

  useEffect(() => {
    if (!organization) return
    listTeams(organization.id)
      .then(setTeams)
      .catch(() => setTeams([]))
    listFormations(organization.id)
      .then(setCustomFormations)
      .catch(() => setCustomFormations([]))
  }, [organization])

  useEffect(() => {
    if (!teamId) {
      setPlayers([])
      return
    }
    listPlayers(teamId)
      .then(setPlayers)
      .catch(() => setPlayers([]))
  }, [teamId])

  function handlePickPlayer(player: Player) {
    setPendingPlayer({
      id: player.id,
      jerseyNumber: player.jersey_number,
      label: `${player.first_name} ${player.last_name}`,
    })
    setTool('player_home')
  }

  function handleApplyFormation() {
    if (!selectedFormationKey) return
    const preset = PRESET_FORMATIONS.find((p) => p.type === selectedFormationKey)
    const custom = customFormations.find((f) => f.id === selectedFormationKey)
    const positions = preset?.positions ?? custom?.positions
    if (!positions) return

    beginHistoryCheckpoint()
    applyFormationToFrame(
      positions,
      players.map((p) => ({
        id: p.id,
        jerseyNumber: p.jersey_number,
        label: `${p.first_name} ${p.last_name}`,
      })),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-white/60">Team</span>
        <select
          className={selectClass}
          value={teamId ?? ''}
          onChange={(e) => setTeamId(e.target.value || null)}
        >
          <option value="">– kein Team –</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {teamId && (
        <>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-white/60">Formation</span>
            <div className="flex gap-1.5">
              <select
                className={`${selectClass} flex-1`}
                value={selectedFormationKey}
                onChange={(e) => setSelectedFormationKey(e.target.value)}
              >
                <option value="">–</option>
                <optgroup label="Vorlagen">
                  {PRESET_FORMATIONS.map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                {customFormations.length > 0 && (
                  <optgroup label="Eigene">
                    {customFormations.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <Button
                variant="secondary"
                disabled={!selectedFormationKey}
                onClick={handleApplyFormation}
              >
                Anwenden
              </Button>
            </div>
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-white/60">
              Kader {pendingPlayer && '(Spieler ausgewählt – aufs Feld klicken)'}
            </span>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-xs text-white/40">Keine Spieler in diesem Team.</p>
              ) : (
                players
                  .slice()
                  .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePickPlayer(p)}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        pendingPlayer?.id === p.id
                          ? 'bg-violet-accent text-white'
                          : 'bg-pitch-800 text-white/70 hover:bg-pitch-700 hover:text-white'
                      }`}
                    >
                      <span className="w-5 shrink-0 text-center font-semibold">
                        {p.jersey_number ?? '–'}
                      </span>
                      <span className="truncate">
                        {p.first_name} {p.last_name}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
