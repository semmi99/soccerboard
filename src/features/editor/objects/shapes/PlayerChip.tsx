import { Circle, Group, Image as KonvaImage, Text } from 'react-konva'
import useImage from 'use-image'
import { TEAM_COLORS } from '../../constants'
import type { PlayerChipData } from '../../types'
import { useAuthStore } from '../../../auth/store/authStore'

export function PlayerChipShape({ data }: { data: PlayerChipData }) {
  const color = TEAM_COLORS[data.team]
  const logoUrl = useAuthStore((s) => s.organization?.logo_url)
  const showLogo = data.team === 'home' && Boolean(logoUrl)
  const [image] = useImage(showLogo ? (logoUrl as string) : '', 'anonymous')

  return (
    <Group>
      <Circle radius={18} fill={color} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
      {showLogo && image ? (
        <>
          <Group clipFunc={(ctx) => ctx.arc(0, 0, 16, 0, Math.PI * 2, false)}>
            <KonvaImage image={image} x={-16} y={-16} width={32} height={32} />
          </Group>
          <Circle x={13} y={13} radius={8} fill={color} stroke="#ffffff" strokeWidth={1.5} />
          <Text
            text={String(data.number)}
            fontSize={9}
            fontStyle="bold"
            fill="#ffffff"
            width={16}
            height={16}
            offsetX={8}
            offsetY={8}
            x={13}
            y={13}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      ) : (
        <Text
          text={String(data.number)}
          fontSize={15}
          fontStyle="bold"
          fill="#ffffff"
          width={36}
          height={36}
          offsetX={18}
          offsetY={18}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
      {data.label && (
        <Text
          text={data.label}
          fontSize={11}
          fill="#ffffff"
          width={100}
          offsetX={50}
          y={22}
          align="center"
          listening={false}
        />
      )}
    </Group>
  )
}
