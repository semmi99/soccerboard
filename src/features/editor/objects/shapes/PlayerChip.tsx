import { Circle, Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import useImage from 'use-image'
import { TEAM_COLORS } from '../../constants'
import type { KitConfig, PlayerChipData } from '../../types'
import { useAuthStore } from '../../../auth/store/authStore'
import { useEditorStore } from '../../store/editorStore'

const CHIP_R = 18

function KitFill({ kit }: { kit: KitConfig }) {
  if (kit.pattern === 'solid') {
    return <Circle radius={CHIP_R} fill={kit.color1} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
  }

  const bars =
    kit.pattern === 'stripes'
      ? Array.from({ length: 5 }, (_, i) => {
          const w = (CHIP_R * 2) / 5
          return (
            <Rect
              key={i}
              x={-CHIP_R + i * w}
              y={-CHIP_R}
              width={w}
              height={CHIP_R * 2}
              fill={i % 2 === 0 ? kit.color1 : kit.color2}
            />
          )
        })
      : Array.from({ length: 4 }, (_, i) => {
          const h = (CHIP_R * 2) / 4
          return (
            <Rect
              key={i}
              x={-CHIP_R}
              y={-CHIP_R + i * h}
              width={CHIP_R * 2}
              height={h}
              fill={i % 2 === 0 ? kit.color1 : kit.color2}
            />
          )
        })

  return (
    <>
      <Group clipFunc={(ctx) => ctx.arc(0, 0, CHIP_R, 0, Math.PI * 2, false)}>{bars}</Group>
      <Circle radius={CHIP_R} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
    </>
  )
}

export function PlayerChipShape({ data }: { data: PlayerChipData }) {
  const teamKit = useEditorStore((s) => s.teamKit)
  const kit: KitConfig = teamKit
    ? teamKit[data.team]
    : { pattern: 'solid', color1: TEAM_COLORS[data.team], color2: TEAM_COLORS[data.team] }
  const badgeColor = kit.color1
  const logoUrl = useAuthStore((s) => s.organization?.logo_url)
  const showLogo = data.team === 'home' && Boolean(logoUrl)
  const [image] = useImage(showLogo ? (logoUrl as string) : '', 'anonymous')

  return (
    <Group>
      {showLogo && image ? (
        <>
          <Circle radius={CHIP_R} fill="#ffffff" stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
          <Group clipFunc={(ctx) => ctx.arc(0, 0, 16, 0, Math.PI * 2, false)}>
            <KonvaImage image={image} x={-16} y={-16} width={32} height={32} />
          </Group>
          <Circle x={13} y={13} radius={8} fill={badgeColor} stroke="#ffffff" strokeWidth={1.5} />
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
        <>
          <KitFill kit={kit} />
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
            shadowColor="#000000"
            shadowBlur={3}
            shadowOpacity={0.6}
          />
        </>
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
