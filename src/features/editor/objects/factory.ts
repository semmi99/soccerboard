import type { EquipmentKind, FrameObject, ToolId } from '../types'

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

  if (tool === 'line_straight') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        points: [-70, 0, 70, 0],
        lineStyle: 'dashed',
        color: '#38bdf8',
        strokeWidth: 2.5,
        showArrowhead: false,
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

  if (tool === 'shape_polygon') {
    return {
      ...base,
      objectType: 'shape',
      data: {
        kind: 'polygon',
        width: 100,
        height: 70,
        // A trapezoid by default (not a rectangle!) so this reads as its own
        // freely-reshapeable zone shape from the moment it's placed, instead
        // of looking identical to the plain Rechteck tool until dragged.
        points: [-30, -35, 30, -35, 55, 35, -55, 35],
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
      data: { text: 'Text', fontSize: 20, color: '#ffffff', fontStyle: 'normal' },
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
      data: { text: 'BADGE', fontSize: 15, color: '#0f3d59', fontStyle: 'bold', background: '#ffe100' },
    }
  }

  if (tool === 'text_title') {
    return {
      ...base,
      objectType: 'text',
      data: { text: 'Titel', fontSize: 28, color: '#ffffff', fontStyle: 'bold', shadow: true },
    }
  }

  if (tool === 'text_subtitle') {
    return {
      ...base,
      objectType: 'text',
      data: { text: 'Untertitel', fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'normal', shadow: true },
    }
  }

  if (tool === 'ball') {
    return { ...base, objectType: 'ball', data: {} }
  }

  if (tool.startsWith('equipment_')) {
    const kind = tool.slice('equipment_'.length) as EquipmentKind
    return { ...base, objectType: 'training_equipment', data: { kind } }
  }

  return null
}
