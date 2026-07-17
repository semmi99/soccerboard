import { Text } from 'react-konva'
import type { TextData } from '../../types'

export function TextItem({ data }: { data: TextData }) {
  return (
    <Text
      text={data.text}
      fontSize={data.fontSize}
      fontStyle={data.fontStyle}
      fill={data.color}
      padding={4}
    />
  )
}
