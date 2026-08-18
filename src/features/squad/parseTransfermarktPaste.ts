export interface ParsedTransfermarktPlayer {
  firstName: string
  lastName: string
  jerseyNumber: number | null
  position: string | null
}

// Transfermarkt's fixed German position vocabulary → this app's own
// (coarser) position dropdown values. Anchoring the parser on these exact
// labels is what makes it robust: whatever a copy-pasted Kader table's
// whitespace/column layout looks like (it varies with tab/browser and
// "Kompakt" vs "Erweitert" view), a player's name is always immediately
// followed by one of these on the next line, since they're the same table
// cell (name + position stacked) — everything else (age, nationality,
// contract, market value, ...) trails after and is safely ignored.
const POSITION_DE: Record<string, string> = {
  Torwart: 'Torwart',
  Innenverteidiger: 'Innenverteidigung',
  'Linker Verteidiger': 'Außenverteidigung',
  'Rechter Verteidiger': 'Außenverteidigung',
  Verteidiger: 'Außenverteidigung',
  'Defensives Mittelfeld': 'Defensives Mittelfeld',
  'Zentrales Mittelfeld': 'Zentrales Mittelfeld',
  'Offensives Mittelfeld': 'Offensives Mittelfeld',
  Linksaußen: 'Flügel',
  Rechtsaußen: 'Flügel',
  'Hängende Spitze': 'Stürmer',
  Mittelstürmer: 'Stürmer',
  Stürmer: 'Stürmer',
}

const POSITION_PATTERN = Object.keys(POSITION_DE)
  // Longest first, so e.g. "Linker Verteidiger" matches before a bare
  // "Verteidiger" fallback would ever get the chance to.
  .sort((a, b) => b.length - a.length)
  .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

// number → gap → name → gap → one of the known position labels. The gaps
// match any whitespace (\s+, not just \n/\t) since a real OS copy-paste's
// exact cell separators vary by browser: Windows clipboards often use \r\n
// instead of \n, and some browsers tab-separate a multi-line cell's content
// on one line instead of using a real newline. Anchoring loosely on "some
// whitespace" rather than an exact character sequence is what makes this
// resilient to that. Global match scans the whole pasted blob for this
// shape wherever it occurs, so it doesn't care how many rows there are or
// what other columns surround each one.
const ROW_PATTERN = new RegExp(`(\\d{1,3})\\s+([^\\s\\d][^\\r\\n\\t]*?)\\s+(${POSITION_PATTERN})\\b`, 'g')

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, lastSpace), lastName: trimmed.slice(lastSpace + 1) }
}

/** Parses a Transfermarkt "Kader"-table paste (select the squad table on a
 * team's Kader page, copy, paste here) into player entries. Best-effort:
 * a row without a recognizable jersey number (e.g. an unassigned new
 * signing shown as "-") is skipped rather than guessed at — same as any
 * unrecognized line in the plain bulk-add dialog. */
export function parseTransfermarktPaste(text: string): ParsedTransfermarktPlayer[] {
  const results: ParsedTransfermarktPlayer[] = []
  for (const match of text.matchAll(ROW_PATTERN)) {
    const [, numberStr, rawName, positionLabel] = match
    const { firstName, lastName } = splitName(rawName!)
    if (!firstName || !lastName) continue
    results.push({
      firstName,
      lastName,
      jerseyNumber: Number(numberStr),
      position: POSITION_DE[positionLabel!] ?? null,
    })
  }
  return results
}
