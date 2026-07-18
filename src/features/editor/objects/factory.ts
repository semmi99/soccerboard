import type { ArrowShape, EquipmentKind, FrameObject, ToolId } from '../types'

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

  if (tool === 'arrow_straight' || tool === 'arrow_curved') {
    const shape: ArrowShape = tool === 'arrow_straight' ? 'straight' : 'curved'
    return {
      ...base,
      objectType: 'arrow',
      data: {
        shape,
        points: shape === 'curved' ? [0, 0, 50, -40, 100, 0] : [0, 0, 100, 0],
        lineStyle: 'solid',
        color: '#f0d878',
        strokeWidth: 3,
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
        height: 100,
        points: [-50, -35, 50, -35, 50, 35, -50, 35],
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
