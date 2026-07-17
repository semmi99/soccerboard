import type { ReactNode } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { EquipmentKind, ToolId } from '../types'
import {
  BallIcon,
  ConeIcon,
  CurvedArrowIcon,
  CircleShapeIcon,
  CursorIcon,
  LadderIcon,
  MannequinIcon,
  MiniGoalIcon,
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
  ],
  [
    { id: 'arrow_straight', label: 'Pfeil gerade', icon: <StraightArrowIcon /> },
    { id: 'arrow_curved', label: 'Pfeil kurvig', icon: <CurvedArrowIcon /> },
  ],
  [
    { id: 'shape_circle', label: 'Kreis', icon: <CircleShapeIcon /> },
    { id: 'shape_rect', label: 'Rechteck', icon: <RectShapeIcon /> },
    { id: 'shape_polygon', label: 'Polygon (Zone)', icon: <PolygonShapeIcon /> },
  ],
  [
    { id: 'text', label: 'Text', icon: <TextToolIcon /> },
    { id: 'ball', label: 'Ball', icon: <BallIcon /> },
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
    <aside className="flex w-16 flex-col items-center gap-2 overflow-y-auto border-r border-pitch-700 bg-pitch-900 py-3">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex w-full flex-col items-center gap-1.5">
          {i > 0 && <div className="my-1 h-px w-8 bg-pitch-700" />}
          {section.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={() => setTool(t.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                tool === t.id
                  ? 'bg-violet-accent text-white'
                  : 'bg-pitch-800 text-white/70 hover:bg-pitch-700 hover:text-white'
              }`}
            >
              {t.swatch ? (
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-white/30"
                  style={{ backgroundColor: t.swatch }}
                />
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
