import type { ReactNode } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { EquipmentKind, ToolId } from '../types'
import {
  BallIcon,
  BouncePassIcon,
  ConeIcon,
  ConnectorIcon,
  CircleShapeIcon,
  CursorIcon,
  LadderIcon,
  MannequinIcon,
  MiniGoalIcon,
  PlainLineIcon,
  PlayerZoneIcon,
  PolygonShapeIcon,
  RectShapeIcon,
  ReleasePassIcon,
  RingIcon,
  RunArrowIcon,
  SlalomPoleIcon,
  StraightArrowIcon,
  TextToolIcon,
} from './icons'

interface ToolDef {
  id: ToolId
  label: string
  icon?: ReactNode
  swatch?: string
  swatchLabel?: string
  swatchRing?: string
}

const EQUIPMENT_ICONS: Record<EquipmentKind, ReactNode> = {
  cone: <ConeIcon />,
  mini_goal: <MiniGoalIcon />,
  mannequin: <MannequinIcon />,
  slalom_pole: <SlalomPoleIcon />,
  ladder: <LadderIcon />,
  ring: <RingIcon />,
}

const EQUIPMENT_LABELS: Record<EquipmentKind, string> = {
  cone: 'Hütchen',
  mini_goal: 'Minitor',
  mannequin: 'Dummy',
  slalom_pole: 'Slalomstange',
  ladder: 'Leiter',
  ring: 'Ring',
}

const SECTIONS: ToolDef[][] = [
  [{ id: 'select', label: 'Zeiger', icon: <CursorIcon /> }],
  [
    { id: 'player_home', label: 'Spieler Heim', swatch: '#3b82f6' },
    { id: 'player_away', label: 'Spieler Auswärts', swatch: '#ef4444' },
    {
      id: 'player_home_gk',
      label: 'Torwart Heim',
      swatch: '#eab308',
      swatchLabel: 'TW',
      swatchRing: '#3b82f6',
    },
    {
      id: 'player_away_gk',
      label: 'Torwart Auswärts',
      swatch: '#eab308',
      swatchLabel: 'TW',
      swatchRing: '#ef4444',
    },
    { id: 'ball', label: 'Ball', icon: <BallIcon /> },
  ],
  [
    { id: 'arrow_straight', label: 'Pfeil (Ziehpunkte zum Biegen)', icon: <StraightArrowIcon /> },
    { id: 'line_straight', label: 'Linie (Zone einzeichnen)', icon: <PlainLineIcon /> },
    { id: 'connector', label: 'Spieler verbinden', icon: <ConnectorIcon /> },
    { id: 'player_zone', label: 'Spielerzone (Fläche füllen)', icon: <PlayerZoneIcon /> },
  ],
  [
    { id: 'pass_release', label: 'Passlinie (Release)', icon: <ReleasePassIcon /> },
    { id: 'pass_bounce', label: 'Doppelpass (Bounce)', icon: <BouncePassIcon /> },
    { id: 'run_arrow', label: 'Laufweg (ohne Ball)', icon: <RunArrowIcon /> },
  ],
  [
    { id: 'shape_circle', label: 'Kreis', icon: <CircleShapeIcon /> },
    { id: 'shape_rect', label: 'Rechteck', icon: <RectShapeIcon /> },
    { id: 'shape_polygon', label: 'Polygon (Zone)', icon: <PolygonShapeIcon /> },
  ],
  [
    { id: 'text', label: 'Text', icon: <TextToolIcon /> },
    { id: 'text_badge', label: 'Badge', swatch: '#ffe100', swatchLabel: 'B' },
    { id: 'text_title', label: 'Titel', swatch: '#f8fafc', swatchLabel: 'T' },
    { id: 'text_subtitle', label: 'Untertitel', swatch: '#94a3b8', swatchLabel: 'U' },
  ],
  (Object.keys(EQUIPMENT_ICONS) as EquipmentKind[]).map((kind) => ({
    id: `equipment_${kind}` as ToolId,
    label: EQUIPMENT_LABELS[kind],
    icon: EQUIPMENT_ICONS[kind],
  })),
]

export function Toolbar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)

  return (
    <aside className="flex w-28 flex-col items-center gap-2 overflow-y-auto border-r border-black/40 bg-[#0a1628] px-2 py-3">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex w-full flex-col items-center gap-1.5">
          {i > 0 && <div className="my-1 h-px w-full bg-gold-accent/20" />}
          <div
            className={
              section.length > 1 ? 'grid w-full grid-cols-2 gap-1.5' : 'flex w-full justify-center'
            }
          >
            {section.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                aria-label={t.label}
                onClick={() => setTool(t.id)}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                  tool === t.id
                    ? 'border-gold-accent bg-[#132540] text-gold-accent-bright'
                    : 'border-gold-accent/10 bg-[#0d1e35] text-gold-accent/70 hover:border-gold-accent/40 hover:text-gold-accent-bright'
                }`}
              >
                {t.swatch ? (
                  <span
                    className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30 text-[7px] font-bold text-black/70"
                    style={{
                      backgroundColor: t.swatch,
                      boxShadow: t.swatchRing ? `0 0 0 2px ${t.swatchRing}` : undefined,
                    }}
                  >
                    {t.swatchLabel}
                  </span>
                ) : (
                  t.icon
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
