import type { ReactNode } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { EquipmentKind, ToolId } from '../types'
import {
  BallIcon,
  ConeIcon,
  ConnectorIcon,
  CurvedArrowIcon,
  CircleShapeIcon,
  CursorIcon,
  LadderIcon,
  MannequinIcon,
  MiniGoalIcon,
  PlainLineIcon,
  PlayerZoneIcon,
  PolygonShapeIcon,
  RectShapeIcon,
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
}

const EQUIPMENT_LABELS: Record<EquipmentKind, string> = {
  cone: 'Hütchen',
  mini_goal: 'Minitor',
  mannequin: 'Dummy',
  slalom_pole: 'Slalomstange',
  ladder: 'Leiter',
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
    { id: 'arrow_straight', label: 'Pfeil gerade', icon: <StraightArrowIcon /> },
    { id: 'arrow_curved', label: 'Pfeil kurvig', icon: <CurvedArrowIcon /> },
    { id: 'line_straight', label: 'Linie (Zone einzeichnen)', icon: <PlainLineIcon /> },
    { id: 'connector', label: 'Spieler verbinden', icon: <ConnectorIcon /> },
    { id: 'player_zone', label: 'Spielerzone (Fläche füllen)', icon: <PlayerZoneIcon /> },
  ],
  [
    { id: 'shape_circle', label: 'Kreis', icon: <CircleShapeIcon /> },
    { id: 'shape_rect', label: 'Rechteck', icon: <RectShapeIcon /> },
    { id: 'shape_polygon', label: 'Polygon (Zone)', icon: <PolygonShapeIcon /> },
  ],
  [{ id: 'text', label: 'Text', icon: <TextToolIcon /> }],
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
    <aside className="flex w-16 flex-col items-center gap-2 overflow-y-auto border-r border-black/40 bg-[#0a1628] py-3">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex w-full flex-col items-center gap-1.5">
          {i > 0 && <div className="my-1 h-px w-8 bg-gold-accent/20" />}
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
      ))}
    </aside>
  )
}
