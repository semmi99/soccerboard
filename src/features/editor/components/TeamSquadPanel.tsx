import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import {
  listTeams,
  listPlayers,
  updateTeamKit,
  uploadTeamCrest,
  removeTeamCrest,
  uploadCustomCrest,
  type Player,
  type Team,
} from '../../../lib/supabase/squad'
import { listFormations, type Formation } from '../../../lib/supabase/formations'
import { PRESET_FORMATIONS } from '../../formations/presets'
import { Button } from '../../../components/ui/Button'
import { KitDesignerModal } from '../../squad/components/KitDesignerModal'
import { TEAM_COLORS } from '../constants'
import type { KitPattern, TeamKit } from '../types'

const DEFAULT_CUSTOM_KIT: TeamKit = {
  home: { pattern: 'solid', color1: TEAM_COLORS.home, color2: TEAM_COLORS.home },
  away: { pattern: 'solid', color1: TEAM_COLORS.away, color2: TEAM_COLORS.away },
  gk: { pattern: 'solid', color1: '#eab308', color2: '#111827' },
  chipScale: 1,
}

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

function CrestSlot({
  label,
  hint,
  crestUrl,
  isUploading,
  onFile,
  onRemove,
}: {
  label: string
  hint: string
  crestUrl: string | null
  isUploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-md border border-pitch-700 p-2">
        {crestUrl ? (
          <img
            src={crestUrl}
            alt={t('teamSquadPanel.crestAlt')}
            className="h-8 w-8 shrink-0 rounded-full bg-pitch-800 object-contain"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-pitch-800" />
        )}
        <label className="flex-1 cursor-pointer text-center text-xs text-white/70 hover:text-white">
          {isUploading ? t('teamSquadPanel.uploadingCrest') : label}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
              e.target.value = ''
            }}
          />
        </label>
        {crestUrl && (
          <Button variant="danger" onClick={onRemove}>
            ×
          </Button>
        )}
      </div>
      {crestUrl && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  )
}

export function TeamSquadPanel() {
  const { t } = useTranslation('editor')
  const organization = useAuthStore((s) => s.organization)
  const teamId = useEditorStore((s) => s.teamId)
  const setTeamId = useEditorStore((s) => s.setTeamId)
  const setTeamKit = useEditorStore((s) => s.setTeamKit)
  const customKit = useEditorStore((s) => s.customKit)
  const setCustomKit = useEditorStore((s) => s.setCustomKit)
  const setPlayerPhotos = useEditorStore((s) => s.setPlayerPhotos)
  const pendingPlayer = useEditorStore((s) => s.pendingPlayer)
  const setPendingPlayer = useEditorStore((s) => s.setPendingPlayer)
  const pendingPlayers = useEditorStore((s) => s.pendingPlayers)
  const setPendingPlayers = useEditorStore((s) => s.setPendingPlayers)
  const setTool = useEditorStore((s) => s.setTool)
  const applyFormationToFrame = useEditorStore((s) => s.applyFormationToFrame)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)

  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [customFormations, setCustomFormations] = useState<Formation[]>([])
  const [selectedFormationKey, setSelectedFormationKey] = useState<string>('')
  const [showKitDesigner, setShowKitDesigner] = useState(false)
  const [groupSelectIds, setGroupSelectIds] = useState<Set<string>>(new Set())
  const [isUploadingCrest, setIsUploadingCrest] = useState(false)

  const activeTeam = teams.find((team) => team.id === teamId) ?? null

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
      setPlayerPhotos({})
      return
    }
    listPlayers(teamId)
      .then((data) => {
        setPlayers(data)
        const photos: Record<string, string> = {}
        for (const p of data) {
          if (p.photo_url) photos[p.id] = p.photo_url
        }
        setPlayerPhotos(photos)
      })
      .catch(() => setPlayers([]))
  }, [teamId, setPlayerPhotos])

  useEffect(() => {
    if (!activeTeam) {
      // No linked team — fall back to whatever custom kit is saved with this
      // project (or null, which PlayerChip resolves to plain default colors).
      setTeamKit(customKit)
      return
    }
    setTeamKit({
      home: {
        pattern: activeTeam.home_kit_pattern as KitPattern,
        color1: activeTeam.home_kit_color1,
        color2: activeTeam.home_kit_color2,
      },
      away: {
        pattern: activeTeam.away_kit_pattern as KitPattern,
        color1: activeTeam.away_kit_color1,
        color2: activeTeam.away_kit_color2,
      },
      gk: {
        pattern: activeTeam.gk_kit_pattern as KitPattern,
        color1: activeTeam.gk_kit_color1,
        color2: activeTeam.gk_kit_color2,
      },
      chipScale: activeTeam.chip_scale,
      // A linked team's crest only replaces the HOME chips' colors — the
      // away side represents the opponent, who isn't this club, so it must
      // never inherit the linked team's badge (previously mirrored to both
      // sides, which incorrectly badged the opposing chips too).
      homeCrestUrl: activeTeam.crest_url,
      awayCrestUrl: null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam, setTeamKit])

  function handlePickPlayer(player: Player) {
    setPendingPlayer({
      id: player.id,
      jerseyNumber: player.jersey_number,
      label: `${player.first_name} ${player.last_name}`,
      isGoalkeeper: player.position === 'Torwart',
    })
    setTool('player_home')
  }

  function toggleGroupSelect(id: string) {
    setGroupSelectIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handlePlaceGroup(team: 'home' | 'away') {
    const chosen = players
      .filter((p) => groupSelectIds.has(p.id))
      .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
    if (!chosen.length) return
    setPendingPlayers(
      chosen.map((p) => ({
        id: p.id,
        jerseyNumber: p.jersey_number,
        label: `${p.first_name} ${p.last_name}`,
        isGoalkeeper: p.position === 'Torwart',
      })),
    )
    setTool(team === 'home' ? 'player_home' : 'player_away')
    setGroupSelectIds(new Set())
  }

  async function handleCrestFile(file: File, side: 'home' | 'away') {
    if (!organization) return
    setIsUploadingCrest(true)
    try {
      if (activeTeam) {
        const crestUrl = await uploadTeamCrest(organization.id, activeTeam.id, file)
        setTeams((ts) => ts.map((t) => (t.id === activeTeam.id ? { ...t, crest_url: crestUrl } : t)))
      } else {
        const crestUrl = await uploadCustomCrest(organization.id, file)
        setCustomKit({
          ...(customKit ?? DEFAULT_CUSTOM_KIT),
          [side === 'home' ? 'homeCrestUrl' : 'awayCrestUrl']: crestUrl,
        })
      }
    } finally {
      setIsUploadingCrest(false)
    }
  }

  async function handleRemoveCrest(side: 'home' | 'away') {
    if (activeTeam) {
      await removeTeamCrest(activeTeam.id)
      setTeams((ts) => ts.map((t) => (t.id === activeTeam.id ? { ...t, crest_url: null } : t)))
    } else if (customKit) {
      setCustomKit({ ...customKit, [side === 'home' ? 'homeCrestUrl' : 'awayCrestUrl']: null })
    }
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
        isGoalkeeper: p.position === 'Torwart',
      })),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-white/60">{t('teamSquadPanel.team')}</span>
        <select
          className={selectClass}
          value={teamId ?? ''}
          onChange={(e) => setTeamId(e.target.value || null)}
        >
          <option value="">{t('teamSquadPanel.noTeam')}</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <Button variant="secondary" className="w-full" onClick={() => setShowKitDesigner(true)}>
        {activeTeam ? t('teamSquadPanel.editKitDesign') : t('teamSquadPanel.customizeColors')}
      </Button>

      {activeTeam ? (
        <CrestSlot
          label={t('teamSquadPanel.uploadCrest')}
          hint={t('teamSquadPanel.crestHintTeam')}
          crestUrl={activeTeam.crest_url}
          isUploading={isUploadingCrest}
          onFile={(file) => void handleCrestFile(file, 'home')}
          onRemove={() => void handleRemoveCrest('home')}
        />
      ) : (
        <>
          <CrestSlot
            label={t('teamSquadPanel.uploadCrestHome')}
            hint={t('teamSquadPanel.crestHintHome')}
            crestUrl={customKit?.homeCrestUrl ?? null}
            isUploading={isUploadingCrest}
            onFile={(file) => void handleCrestFile(file, 'home')}
            onRemove={() => void handleRemoveCrest('home')}
          />
          <CrestSlot
            label={t('teamSquadPanel.uploadCrestAway')}
            hint={t('teamSquadPanel.crestHintAway')}
            crestUrl={customKit?.awayCrestUrl ?? null}
            isUploading={isUploadingCrest}
            onFile={(file) => void handleCrestFile(file, 'away')}
            onRemove={() => void handleRemoveCrest('away')}
          />
        </>
      )}

      {showKitDesigner && (
        <KitDesignerModal
          title={
            activeTeam
              ? t('teamSquadPanel.kitDesignTitle', { name: activeTeam.name })
              : t('teamSquadPanel.customizeColors')
          }
          description={activeTeam ? undefined : t('teamSquadPanel.noTeamLinkedNote')}
          allowTemplates={!activeTeam}
          initial={{
            homeKitPattern: (activeTeam?.home_kit_pattern ?? customKit?.home.pattern ?? DEFAULT_CUSTOM_KIT.home.pattern) as KitPattern,
            homeKitColor1: activeTeam?.home_kit_color1 ?? customKit?.home.color1 ?? DEFAULT_CUSTOM_KIT.home.color1,
            homeKitColor2: activeTeam?.home_kit_color2 ?? customKit?.home.color2 ?? DEFAULT_CUSTOM_KIT.home.color2,
            awayKitPattern: (activeTeam?.away_kit_pattern ?? customKit?.away.pattern ?? DEFAULT_CUSTOM_KIT.away.pattern) as KitPattern,
            awayKitColor1: activeTeam?.away_kit_color1 ?? customKit?.away.color1 ?? DEFAULT_CUSTOM_KIT.away.color1,
            awayKitColor2: activeTeam?.away_kit_color2 ?? customKit?.away.color2 ?? DEFAULT_CUSTOM_KIT.away.color2,
            gkKitPattern: (activeTeam?.gk_kit_pattern ?? customKit?.gk.pattern ?? DEFAULT_CUSTOM_KIT.gk.pattern) as KitPattern,
            gkKitColor1: activeTeam?.gk_kit_color1 ?? customKit?.gk.color1 ?? DEFAULT_CUSTOM_KIT.gk.color1,
            gkKitColor2: activeTeam?.gk_kit_color2 ?? customKit?.gk.color2 ?? DEFAULT_CUSTOM_KIT.gk.color2,
            chipScale: activeTeam?.chip_scale ?? customKit?.chipScale ?? DEFAULT_CUSTOM_KIT.chipScale,
            homeCrestUrl: activeTeam ? undefined : (customKit?.homeCrestUrl ?? null),
            awayCrestUrl: activeTeam ? undefined : (customKit?.awayCrestUrl ?? null),
          }}
          onClose={() => setShowKitDesigner(false)}
          onSave={async (patch) => {
            if (activeTeam) {
              const updated = await updateTeamKit(activeTeam.id, patch)
              setTeams((ts) => ts.map((t) => (t.id === updated.id ? updated : t)))
            } else {
              setCustomKit({
                home: { pattern: patch.homeKitPattern, color1: patch.homeKitColor1, color2: patch.homeKitColor2 },
                away: { pattern: patch.awayKitPattern, color1: patch.awayKitColor1, color2: patch.awayKitColor2 },
                gk: { pattern: patch.gkKitPattern, color1: patch.gkKitColor1, color2: patch.gkKitColor2 },
                chipScale: patch.chipScale,
                homeCrestUrl: patch.homeCrestUrl ?? customKit?.homeCrestUrl ?? null,
                awayCrestUrl: patch.awayCrestUrl ?? customKit?.awayCrestUrl ?? null,
              })
            }
          }}
        />
      )}

      {teamId && (
        <>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-white/60">{t('teamSquadPanel.formation')}</span>
            <div className="flex gap-1.5">
              <select
                className={`${selectClass} flex-1`}
                value={selectedFormationKey}
                onChange={(e) => setSelectedFormationKey(e.target.value)}
              >
                <option value="">–</option>
                <optgroup label={t('teamSquadPanel.templatesGroup')}>
                  {PRESET_FORMATIONS.map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                {customFormations.length > 0 && (
                  <optgroup label={t('teamSquadPanel.customGroup')}>
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
                {t('teamSquadPanel.apply')}
              </Button>
            </div>
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-white/60">
              {t('teamSquadPanel.squad')}{' '}
              {pendingPlayer
                ? t('teamSquadPanel.playerSelectedHint')
                : pendingPlayers.length > 0
                  ? t('teamSquadPanel.playersSelectedHint', { count: pendingPlayers.length })
                  : t('teamSquadPanel.selectHint')}
            </span>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-xs text-white/40">{t('teamSquadPanel.noPlayers')}</p>
              ) : (
                players
                  .slice()
                  .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        pendingPlayer?.id === p.id
                          ? 'bg-violet-accent text-brand-blue-dark font-medium'
                          : 'bg-pitch-800 text-white/70 hover:bg-pitch-700 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="shrink-0 accent-violet-accent"
                        checked={groupSelectIds.has(p.id)}
                        onChange={() => toggleGroupSelect(p.id)}
                      />
                      <button
                        type="button"
                        onClick={() => handlePickPlayer(p)}
                        className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                      >
                        <span className="w-5 shrink-0 text-center font-semibold">
                          {p.jersey_number ?? '–'}
                        </span>
                        <span className="truncate">
                          {p.first_name} {p.last_name}
                        </span>
                      </button>
                    </div>
                  ))
              )}
            </div>
            {groupSelectIds.size > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-white/50">
                  {t('teamSquadPanel.selectedCount', { count: groupSelectIds.size })}
                </span>
                <Button variant="secondary" onClick={() => handlePlaceGroup('home')}>
                  {t('teamSquadPanel.placeHome')}
                </Button>
                <Button variant="secondary" onClick={() => handlePlaceGroup('away')}>
                  {t('teamSquadPanel.placeAway')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
