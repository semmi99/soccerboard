/** A closed loop of players joined by connector lines — e.g. four players
 * connected 1-2-3-4-1 forming a quadrilateral — detected automatically from
 * the connectors themselves rather than built as its own separate object,
 * so the highlighted area always exactly matches what's actually connected. */
export interface ConnectorZone {
  ids: string[]
  key: string
}

function canonicalKey(cycle: string[]): string {
  let minIdx = 0
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i]! < cycle[minIdx]!) minIdx = i
  }
  const rotated = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)]
  const forward = rotated.join(',')
  const backward = [rotated[0], ...rotated.slice(1).reverse()].join(',')
  return forward < backward ? forward : backward
}

// Simple loops only (each player visited once) — a tactics board realistically
// only ever has a handful of connectors, and no highlighted zone needs more
// than a handful of corners, so cycle length and total result count are
// capped to keep this trivially cheap even on a pathologically dense graph.
const MAX_CYCLE_LENGTH = 8
const MAX_CYCLES = 20

export function findConnectorZones(edges: [string, string][]): ConnectorZone[] {
  const adjacency = new Map<string, Set<string>>()
  for (const [a, b] of edges) {
    if (a === b) continue
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  }

  const zones: ConnectorZone[] = []
  const seenKeys = new Set<string>()
  const nodes = [...adjacency.keys()].sort()

  function dfs(start: string, current: string, path: string[], visited: Set<string>) {
    if (zones.length >= MAX_CYCLES) return
    for (const next of adjacency.get(current) ?? []) {
      if (zones.length >= MAX_CYCLES) return
      if (next === start && path.length >= 3) {
        const key = canonicalKey(path)
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          zones.push({ ids: [...path], key })
        }
        continue
      }
      // Only extend through nodes >= start: avoids rediscovering the same
      // cycle from a different starting point and bounds the search.
      if (next < start || visited.has(next) || path.length >= MAX_CYCLE_LENGTH) continue
      visited.add(next)
      path.push(next)
      dfs(start, next, path, visited)
      path.pop()
      visited.delete(next)
    }
  }

  for (const start of nodes) {
    dfs(start, start, [start], new Set([start]))
  }

  return zones
}
