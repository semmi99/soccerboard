import { Group, Rect, Text } from 'react-konva'
import type { TextData } from '../../types'

export function TextItem({ data }: { data: TextData }) {
  const shadowProps = data.shadow
    ? { shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.8 }
    : {}

  if (data.background) {
    const paddingX = 14
    const height = data.fontSize + 14
    const width = data.fontSize * data.text.length * 0.62 + paddingX * 2
    return (
      <Group>
        <Rect width={width} height={height} cornerRadius={height / 2} fill={data.background} />
        <Text
          text={data.text}
          fontSize={data.fontSize}
          fontStyle={data.fontStyle}
          fill={data.color}
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    )
  }

  return (
    <Text
      text={data.text}
      fontSize={data.fontSize}
      fontStyle={data.fontStyle}
      fill={data.color}
      padding={4}
      {...shadowProps}
    />
  )
}
