import { Layer, Stage } from 'react-konva'
import { useTranslation } from 'react-i18next'
import { Pitch } from '../../editor/components/Pitch'
import { ObjectRenderer } from '../../editor/objects/ObjectRenderer'
import { PITCH_LOGICAL } from '../../editor/constants'
import type { EditorFrame } from '../../editor/types'

const THUMB_WIDTH = 160
const SCALE = THUMB_WIDTH / PITCH_LOGICAL.width
const THUMB_HEIGHT = PITCH_LOGICAL.height * SCALE

function noop() {}

/** A small, non-interactive diagram preview for a saved exercise — reuses
 * the real Pitch/ObjectRenderer components instead of reimplementing
 * per-object-type drawing in SVG. Exercises don't store their own pitch
 * design/orientation (only object data), so this always renders a neutral
 * default background rather than whatever the exercise's author had
 * picked. */
export function ExerciseThumbnail({ frame }: { frame: EditorFrame | undefined }) {
  const { t } = useTranslation('training')

  if (!frame || frame.objects.length === 0) {
    return (
      <div
        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
        className="flex shrink-0 items-center justify-center rounded-md bg-pitch-800 text-[10px] text-white/30"
      >
        {t('exerciseThumbnail.empty')}
      </div>
    )
  }

  return (
    <div style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }} className="shrink-0 overflow-hidden rounded-md">
      <Stage width={THUMB_WIDTH} height={THUMB_HEIGHT} scaleX={SCALE} scaleY={SCALE} listening={false}>
        <Layer>
          <Pitch design="classic_green" orientation="horizontal" />
        </Layer>
        <Layer listening={false}>
          {frame.objects.map((object) => (
            <ObjectRenderer
              key={object.id}
              object={object}
              isSelected={false}
              interactive={false}
              listening={false}
              onSelect={noop}
              onDragStart={noop}
              onDragMove={noop}
              onDragEnd={noop}
              onTransformEnd={noop}
              registerRef={noop}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
