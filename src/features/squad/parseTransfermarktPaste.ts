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
  'Linkes Mittelfeld': 'Flügel',
  'Rechtes Mittelfeld': 'Flügel',
  Linksaußen: 'Flügel',
  Rechtsaußen: 'Flügel',
  'Hängende Spitze': 'Stürmer',
  Mittelstürmer: 'Stürmer',
  Stürmer: 'Stürmer',
  // Generic bucket Transfermarkt sometimes shows for very young/reserve
  // players instead of a specific sub-position.
  Abwehr: 'Innenverteidigung',
}

const POSITION_PATTERN = Object.keys(POSITION_DE)
  // Longest first, so e.g. "Linker Verteidiger" matches before a bare
  // "Verteidiger" fallback would ever get the chance to.
  .sort((a, b) => b.length - a.length)
  .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

// number (or "-" for an unassigned squad number) → rest of that same line,
// discarded → a line break → name → gap → one of the known position
// labels. The "rest of that line" is normally empty, but for an on-loan
// player Transfermarkt inserts their current parent club right there
// ("26\tRoda JC Kerkrade\nJordy Steins...") — common enough in a real
// squad (loan-heavy academy sides) that it can't be treated as a rare
// edge case. Discarding everything up to the next line break, whatever it
// is, handles both. The name→position gap stays \s+ (not just \n) since a
// real OS copy-paste's exact cell separators vary by browser: Windows
// clipboards often use \r\n instead of \n, and some browsers tab-separate
// a multi-line cell's content on one line instead of using a real newline.
// Global match scans the whole pasted blob for this shape wherever it
// occurs, so it doesn't care how many rows there are or what other columns
// surround each one.
const ROW_PATTERN = new RegExp(
  `(\\d{1,3}|-)[^\\r\\n]*\\r?\\n\\s*([^\\s\\d][^\\r\\n\\t]*?)\\s+(${POSITION_PATTERN})\\b`,
  'g',
)

// Transfermarkt's player-name cell links to the player's profile, which a
// real browser copy serializes as the name twice in a row (link text +
// something else), tab- or space-separated: "Vinko Colic\tVinko Colic".
// Collapsing that duplicate BEFORE running ROW_PATTERN is what makes name
// recognition work at all on a real copy-paste — without it, the "gap"
// between the (duplicated) name and the position line never lines up.
function collapseDuplicatedNames(text: string): string {
  return text.replace(/([^\r\n]+?)[ \t]+\1(?=\s*\r?\n)/g, '$1')
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, lastSpace), lastName: trimmed.slice(lastSpace + 1) }
}

/** Parses a Transfermarkt "Kader"-table paste (select the squad table on a
 * team's Kader page, copy, paste here) into player entries. Best-effort: a
 * row whose name/position don't line up as expected (e.g. an on-loan
 * player's extra "current club" line breaking up the number-to-name gap)
 * is skipped rather than guessed at — same as any unrecognized line in the
 * plain bulk-add dialog. */
export function parseTransfermarktPaste(text: string): ParsedTransfermarktPlayer[] {
  const cleaned = collapseDuplicatedNames(text)
  const results: ParsedTransfermarktPlayer[] = []
  for (const match of cleaned.matchAll(ROW_PATTERN)) {
    const [, numberStr, rawName, positionLabel] = match
    const { firstName, lastName } = splitName(rawName!)
    if (!firstName || !lastName) continue
    results.push({
      firstName,
      lastName,
      jerseyNumber: numberStr === '-' ? null : Number(numberStr),
      position: POSITION_DE[positionLabel!] ?? null,
    })
  }
  return results
}
