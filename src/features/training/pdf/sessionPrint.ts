import type { PlayerStatus } from '../types'

export interface PrintSessionPlayer {
  name: string
  position: string | null
  status: PlayerStatus
}

export interface PrintSessionExercise {
  exerciseName: string
  exerciseCategory: string
  exerciseDescription: string | null
}

export interface PrintSessionInput {
  sessionNumber: number
  sessionDate: string
  teamName: string
  schwerpunkt: string
  spielphase: string
  unterphaseName: string | null
  prinzipName: string | null
  koerperlich: number
  physisch: number
  players: PrintSessionPlayer[]
  exercises: PrintSessionExercise[]
}

const STATUS_LABELS: Record<PlayerStatus, string> = {
  aktiv: 'aktiv',
  individuell: 'individuell',
  krank: 'krank',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Opens a standalone print-ready window styled for A4 landscape and
 * triggers the browser's native print dialog — the user picks "Save as
 * PDF" there. No PDF library involved: v1 only needs text (no rendered
 * diagram thumbnails), so print-to-PDF handles pagination/margins for
 * free instead of a canvas/jsPDF pipeline. */
export function openSessionPrintWindow(input: PrintSessionInput): void {
  const win = window.open('', '_blank', 'width=1100,height=800')
  if (!win) return

  const rosterRows = input.players
    .map(
      (p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.position ?? '')}</td>
          <td class="status status-${p.status}">${STATUS_LABELS[p.status]}</td>
        </tr>`,
    )
    .join('')

  const exerciseBoxes = input.exercises
    .map(
      (ex) => `
        <div class="exercise-box">
          <h3>${escapeHtml(ex.exerciseName)}</h3>
          <p class="category">${escapeHtml(ex.exerciseCategory)}</p>
          ${ex.exerciseDescription ? `<p class="description">${escapeHtml(ex.exerciseDescription)}</p>` : ''}
        </div>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Trainingseinheit ${input.sessionNumber}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .subtitle { font-size: 12px; color: #555; margin: 0 0 16px; }
  .layout { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; align-items: start; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #f0f0f0; }
  .status-individuell { color: #a16207; font-weight: 600; }
  .status-krank { color: #b91c1c; font-weight: 600; }
  .meta { font-size: 12px; margin-bottom: 12px; }
  .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 16px; }
  .exercises { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .exercise-box { border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; font-size: 11px; }
  .exercise-box h3 { margin: 0 0 2px; font-size: 12px; }
  .exercise-box .category { margin: 0 0 4px; color: #555; }
  .exercise-box .description { margin: 0; color: #333; }
</style>
</head>
<body>
  <h1>Trainingseinheit ${input.sessionNumber}</h1>
  <p class="subtitle">${escapeHtml(input.teamName)} · ${escapeHtml(input.sessionDate)}</p>

  <div class="layout">
    <div>
      <div class="meta">
        <div class="meta-grid">
          <div><strong>Schwerpunkt:</strong> ${escapeHtml(input.schwerpunkt)}</div>
          <div><strong>Spielphase:</strong> ${escapeHtml(input.spielphase)}</div>
          <div><strong>Unterphase:</strong> ${escapeHtml(input.unterphaseName ?? '–')}</div>
          <div><strong>Prinzip:</strong> ${escapeHtml(input.prinzipName ?? '–')}</div>
          <div><strong>Körperlich:</strong> ${input.koerperlich}/10</div>
          <div><strong>Physisch:</strong> ${input.physisch}/10</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Spieler</th><th>Position</th><th>Status</th></tr></thead>
        <tbody>${rosterRows}</tbody>
      </table>
    </div>
    <div class="exercises">${exerciseBoxes}</div>
  </div>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
