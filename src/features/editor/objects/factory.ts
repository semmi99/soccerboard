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
        points: [0, 0, 100, 0],
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

  // Tactical arrow presets: pre-styled shortcuts for the pass/run vocabulary
  // used in coaching explainer diagrams, so a coach doesn't have to manually
  // dial in shape/line-style/color combos for the same three recurring ideas.
  if (tool === 'pass_release') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        points: [0, 0, 110, 0],
        lineStyle: 'solid',
        color: '#fb923c',
        strokeWidth: 3,
      },
    }
  }

  if (tool === 'pass_bounce') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'curved',
        points: [0, 0, 50, -40, 100, 0],
        lineStyle: 'dotted',
        color: '#fbbf24',
        strokeWidth: 2.5,
      },
    }
  }

  if (tool === 'run_arrow') {
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape: 'straight',
        points: [0, 0, 100, 0],
        lineStyle: 'dashed',
        color: '#94a3b8',
        strokeWidth: 2,
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

  if (tool === 'ball') {
    return { ...base, objectType: 'ball', data: {} }
  }

  if (tool.startsWith('equipment_')) {
    const kind = tool.slice('equipment_'.length) as EquipmentKind
    return { ...base, objectType: 'training_equipment', data: { kind } }
  }

  return null
}
