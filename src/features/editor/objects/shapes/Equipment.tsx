import { Circle, Group, Line, Rect } from 'react-konva'
import type { EquipmentData } from '../../types'

export function EquipmentShape({ data }: { data: EquipmentData }) {
  switch (data.kind) {
    case 'cone':
      return (
        <Group>
          <Line points={[0, -16, 9, 10, -9, 10]} closed fill="#f97316" stroke="#c2410c" strokeWidth={1} />
          <Rect x={-11} y={9} width={22} height={4} fill="#c2410c" cornerRadius={1} />
        </Group>
      )
    case 'mini_goal':
      return (
        <Group>
          <Rect x={-16} y={-10} width={32} height={20} stroke="#e5e7eb" strokeWidth={2} fill="rgba(255,255,255,0.08)" />
          <Line points={[-16, -10, 16, 10]} stroke="#e5e7eb" strokeWidth={1} />
          <Line points={[16, -10, -16, 10]} stroke="#e5e7eb" strokeWidth={1} />
        </Group>
      )
    case 'mannequin':
      return (
        <Group>
          <Circle y={-14} radius={6} fill="#94a3b8" />
          <Rect x={-7} y={-8} width={14} height={22} cornerRadius={4} fill="#94a3b8" />
        </Group>
      )
    case 'slalom_pole':
      return (
        <Group>
          <Line points={[0, -22, 0, 10]} stroke="#facc15" strokeWidth={3} />
          <Circle y={12} radius={5} fill="#1f1f3a" stroke="#facc15" strokeWidth={2} />
        </Group>
      )
    case 'ladder':
      return (
        <Group>
          <Rect x={-30} y={-8} width={60} height={16} stroke="#e5e7eb" strokeWidth={2} fill="rgba(255,255,255,0.05)" />
          {[-18, -6, 6, 18].map((x) => (
            <Line key={x} points={[x, -8, x, 8]} stroke="#e5e7eb" strokeWidth={2} />
          ))}
        </Group>
      )
    default:
      return null
  }
}
