import i18n from '../../../lib/i18n'
import { PITCH_STAGE_SIZE } from '../constants'
import type { EquipmentKind, FrameObject, PitchOrientation, ToolId } from '../types'

let homePlayerCount = 0
let awayPlayerCount = 0

export function resetPlayerCounters() {
  homePlayerCount = 0
  awayPlayerCount = 0
}

export interface PendingRealPlayer {
  id: string
  jerseyNumber: number | null
  label: string
  isGoalkeeper?: boolean
}

export function createObjectForTool(
  tool: ToolId,
  x: number,
  y: number,
  pendingPlayer?: PendingRealPlayer | null,
  orientation: PitchOrientation = 'vertical',
): FrameObject | null {
  const base = { id: crypto.randomUUID(), x, y, rotation: 0, scale: 1, zIndex: 0 }

  if (
    tool === 'player_home' ||
    tool === 'player_away' ||
    tool === 'player_home_gk' ||
    tool === 'player_away_gk'
  ) {
    const team = tool === 'player_home' || tool === 'player_home_gk' ? 'home' : 'away'
    const isGoalkeeper = tool === 'player_home_gk' || tool === 'player_away_gk'
    if (pendingPlayer) {
      return {
        ...base,
        objectType: 'player_chip',
        data: {
          team,
          number: pendingPlayer.jerseyNumber ?? 0,
          label: pendingPlayer.label,
          playerId: pendingPlayer.id,
          isGoalkeeper: isGoalkeeper || pendingPlayer.isGoalkeeper,
        },
      }
    }
    const number = team === 'home' ? ++homePlayerCount : ++awayPlayerCount
    return {
      ...base,
      objectType: 'player_chip',
      data: { team, number, label: '', isGoalkeeper },
    }
  }

  if (tool === 'arrow_straight') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        // Two interior bend points from the start, not just the endpoints —
        // so there's immediately something to grab and bend without first
        // discovering the "Ziehpunkt hinzufügen" button in the sidebar.
        points: [0, 0, 33, 0, 67, 0, 100, 0],
        lineStyle: 'solid',
        color: '#f0d878',
        strokeWidth: 3,
      },
    }
  }

  if (tool === 'arrow_rigid') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        points: [-50, 0, 50, 0],
        lineStyle: 'solid',
        color: '#f0d878',
        strokeWidth: 3,
        bendable: false,
      },
    }
  }

  // One-click defensive/pressing line: a dashed line spanning the full pitch
  // width (touchline to touchline), pre-configured with `spaceBehind` so the
  // shaded zone + meter label appear immediately instead of requiring the
  // user to draw a full-width line by hand and then find the toggle.
  if (tool === 'team_line') {
    const stageSize = PITCH_STAGE_SIZE[orientation]
    const half = (orientation === 'vertical' ? stageSize.width : stageSize.height) / 2
    const points = orientation === 'vertical' ? [-half, 0, half, 0] : [0, -half, 0, half]
    return {
      ...base,
      x: orientation === 'vertical' ? stageSize.width / 2 : x,
      y: orientation === 'vertical' ? y : stageSize.height / 2,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        points,
        lineStyle: 'dashed',
        color: '#22c55e',
        strokeWidth: 2,
        showArrowhead: false,
        bendable: false,
        spaceBehind: true,
      },
    }
  }

  if (tool === 'shape_circle') {
    return {
      ...base,
      objectType: 'shape',
      data: {
        kind: 'circle',
        width: 80,
        height: 80,
        fill: 'rgba(124, 58, 237, 0.25)',
        stroke: '#a855f7',
        strokeWidth: 2,
        lineStyle: 'solid',
        opacity: 1,
      },
    }
  }

  if (tool === 'shape_rect') {
    return {
      ...base,
      objectType: 'shape',
      data: {
        kind: 'rect',
        width: 100,
        height: 70,
        fill: 'rgba(124, 58, 237, 0.25)',
        stroke: '#a855f7',
        strokeWidth: 2,
        lineStyle: 'solid',
        opacity: 1,
      },
    }
  }

  if (tool === 'text') {
    return {
      ...base,
      objectType: 'text',
      data: { text: i18n.t('editor:factoryDefaults.text'), fontSize: 20, color: '#ffffff', fontStyle: 'normal' },
    }
  }

  // Badge/Titel/Untertitel: pre-styled shortcuts for the same "coaching
  // explainer" lower-third look tactics reels use, but as ordinary (freely
  // placeable, individually draggable, repeatable) text objects instead of
  // a single fixed per-frame caption block.
  if (tool === 'text_badge') {
    return {
      ...base,
      objectType: 'text',
      data: {
        text: i18n.t('editor:factoryDefaults.badge'),
        fontSize: 15,
        color: '#0f3d59',
        fontStyle: 'bold',
        background: '#ffe100',
      },
    }
  }

  if (tool === 'text_title') {
    return {
      ...base,
      objectType: 'text',
      data: {
        text: i18n.t('editor:factoryDefaults.title'),
        fontSize: 28,
        color: '#ffffff',
        fontStyle: 'bold',
        shadow: true,
      },
    }
  }

  if (tool === 'text_subtitle') {
    return {
      ...base,
      objectType: 'text',
      data: {
        text: i18n.t('editor:factoryDefaults.subtitle'),
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontStyle: 'normal',
        shadow: true,
      },
    }
  }

  if (tool === 'quote_card') {
    return {
      ...base,
      objectType: 'quote_card',
      data: {
        width: 280,
        height: 130,
        background: '#ffffff',
        borderColor: '#0f172a',
        headingText: i18n.t('editor:factoryDefaults.quoteHeading'),
        headingFontFamily: 'system',
        headingFontSize: 13,
        headingColor: '#ef4444',
        headingBoxEnabled: true,
        headingBoxBackground: '#ffffff',
        headingBoxBorderColor: '#ef4444',
        bodyText: i18n.t('editor:factoryDefaults.quoteBody'),
        bodyFontFamily: 'arial_black',
        bodyFontSize: 22,
        bodyColor: '#0f172a',
      },
    }
  }

  if (tool === 'callout_pill') {
    // A compact pointer-label ("THEIR GOAL"-style). Uses the existing
    // QuoteCard object type (so it's automatically draggable/resizable
    // and every existing QuoteCard property control applies to it), but
    // with headingBoxEnabled OFF — that inner box auto-sizes to fit its
    // own text (Math.min against the text length) and ignores the card's
    // own width/height entirely, which made dragging the resize handles
    // visibly do nothing. Here the *card itself* (background color,
    // rounded corners already baked into QuoteCard's Rect) is the pill,
    // so resizing it resizes the actual visible shape like any other
    // object.
    return {
      ...base,
      objectType: 'quote_card',
      data: {
        width: 90,
        height: 34,
        background: '#0f172a',
        borderColor: null,
        headingText: i18n.t('editor:factoryDefaults.calloutPillLabel'),
        headingFontFamily: 'system',
        headingFontSize: 12,
        headingColor: '#ffffff',
        headingAlign: 'center',
        headingBoxEnabled: false,
        bodyText: '',
        bodyFontFamily: 'system',
        bodyFontSize: 12,
        bodyColor: '#0f172a',
      },
    }
  }

  if (tool === 'ball') {
    return { ...base, objectType: 'ball', data: {} }
  }

  if (tool.startsWith('equipment_')) {
    const kind = tool.slice('equipment_'.length) as EquipmentKind
    // The dummy reads noticeably larger than the other equipment at the
    // shared default scale — starts smaller here; the existing "Größe"
    // slider in the properties sidebar still scales up from this point.
    const scale = kind === 'mannequin' ? 0.6 : base.scale
    return { ...base, scale, objectType: 'training_equipment', data: { kind } }
  }

  return null
}
