import { useEditorStore } from '../store/editorStore'
import type { EquipmentKind, ToolId } from '../types'

interface ToolDef {
  id: ToolId
  label: string
  swatch?: string
}

const EQUIPMENT: { kind: EquipmentKind; label: string }[] = [
  { kind: 'cone', label: 'Hütchen' },
  { kind: 'mini_goal', label: 'Minitor' },
  { kind: 'mannequin', label: 'Dummy' },
  { kind: 'slalom_pole', label: 'Stange' },
  { kind: 'ladder', label: 'Leiter' },
]

const SECTIONS: { title: string; tools: ToolDef[] }[] = [
  {
    title: 'Auswahl',
    tools: [{ id: 'select', label: 'Zeiger' }],
  },
  {
    title: 'Spieler',
    tools: [
      { id: 'player_home', label: 'Heim', swatch: '#3b82f6' },
      { id: 'player_away', label: 'Auswärts', swatch: '#ef4444' },
    ],
  },
  {
    title: 'Pfeile',
    tools: [
      { id: 'arrow_straight', label: 'Gerade' },
      { id: 'arrow_curved', label: 'Kurve' },
    ],
  },
  {
    title: 'Formen',
    tools: [
      { id: 'shape_circle', label: 'Kreis' },
      { id: 'shape_rect', label: 'Rechteck' },
      { id: 'shape_polygon', label: 'Polygon' },
    ],
  },
  {
    title: 'Sonstiges',
    tools: [
      { id: 'text', label: 'Text' },
      { id: 'ball', label: 'Ball' },
    ],
  },
  {
    title: 'Trainingsequipment',
    tools: EQUIPMENT.map((e) => ({ id: `equipment_${e.kind}` as ToolId, label: e.label })),
  },
]

export function Toolbar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)

  return (
    <aside className="flex w-48 flex-col gap-4 overflow-y-auto border-r border-pitch-700 bg-pitch-900 p-3">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {section.title}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {section.tools.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                  tool === t.id
                    ? 'bg-violet-accent text-white'
                    : 'bg-pitch-800 text-white/70 hover:bg-pitch-700 hover:text-white'
                }`}
              >
                {t.swatch && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.swatch }}
                  />
                )}
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
