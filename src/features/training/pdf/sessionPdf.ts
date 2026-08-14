import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PlayerStatus } from '../types'

export interface PdfSessionPlayer {
  name: string
  position: string | null
  status: PlayerStatus
}

export interface PdfSessionExercise {
  exerciseName: string
  exerciseCategory: string
  exerciseDescription: string | null
  /** PNG data URL pulled from the exercise's already-rendered Konva
   * thumbnail (see TrainingSessionEditor's exerciseStagesRef) — null if
   * that exercise has no frames to draw. */
  imageDataUrl: string | null
}

export interface PdfSessionInput {
  sessionNumber: number
  sessionDate: string
  teamName: string
  schwerpunkt: string
  spielphase: string
  unterphaseName: string | null
  prinzipName: string | null
  koerperlich: number
  physisch: number
  players: PdfSessionPlayer[]
  exercises: PdfSessionExercise[]
}

const STATUS_LABELS: Record<PlayerStatus, string> = {
  aktiv: 'aktiv',
  individuell: 'individuell',
  krank: 'krank',
  entschuldigt: 'entschuldigt',
}

const PAGE_WIDTH = 297
const MARGIN_X = 12
const IMAGE_ASPECT = 650 / 1000 // matches ExerciseThumbnail's pitch aspect ratio
const EXERCISE_COLUMNS = 3

/** Builds an actual downloadable A4-landscape PDF with jsPDF instead of
 * relying on the browser's print dialog (window.print() left it up to the
 * user to notice/pick "Save as PDF", and some browsers' popup blockers
 * broke an earlier window.open()-based attempt entirely). Each exercise
 * box embeds the real diagram (via addImage) plus its wrapped description
 * — v1 shipped text-only, but that turned out not to be usable on its
 * own: a coach needs to see the actual pitch diagram to run the drill. */
export function downloadSessionPdf(input: PdfSessionInput): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  let y = 14
  doc.setFontSize(16)
  doc.text(`Trainingseinheit ${input.sessionNumber}`, MARGIN_X, y)

  y += 6
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${input.teamName} · ${input.sessionDate}`, MARGIN_X, y)
  doc.setTextColor(20)

  y += 8
  const metaRows: [string, string][] = [
    [`Schwerpunkt: ${input.schwerpunkt}`, `Spielphase: ${input.spielphase}`],
    [`Unterphase: ${input.unterphaseName ?? '–'}`, `Prinzip: ${input.prinzipName ?? '–'}`],
    [`Körperlich: ${input.koerperlich}/10`, `Physisch: ${input.physisch}/10`],
  ]
  for (const [left, right] of metaRows) {
    doc.text(left, MARGIN_X, y)
    doc.text(right, MARGIN_X + 60, y)
    y += 5
  }
  y += 4

  const tableWidth = 95
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_X },
    tableWidth,
    head: [['Spieler', 'Position', 'Status']],
    body: input.players.map((p) => [p.name, p.position ?? '', STATUS_LABELS[p.status]]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
  })

  const exColX = MARGIN_X + tableWidth + 8
  const exGap = 4
  const exWidth = (PAGE_WIDTH - exColX - MARGIN_X - exGap * (EXERCISE_COLUMNS - 1)) / EXERCISE_COLUMNS
  const imageHeight = exWidth * IMAGE_ASPECT
  const titleY = 4
  const categoryY = imageHeight + 8
  const descStartY = categoryY + 4
  const descLineHeight = 3.2
  const maxDescLines = 3
  const boxHeight = descStartY + descLineHeight * maxDescLines

  let exX = exColX
  let exY = y

  input.exercises.forEach((ex, i) => {
    if (i > 0 && i % EXERCISE_COLUMNS === 0) {
      exX = exColX
      exY += boxHeight + exGap
    }

    doc.setFontSize(9)
    doc.setTextColor(20)
    doc.text(ex.exerciseName, exX, exY + titleY, { maxWidth: exWidth })

    if (ex.imageDataUrl) {
      doc.addImage(ex.imageDataUrl, 'PNG', exX, exY + titleY + 2, exWidth, imageHeight)
    } else {
      doc.setDrawColor(210)
      doc.rect(exX, exY + titleY + 2, exWidth, imageHeight)
    }

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(ex.exerciseCategory, exX, exY + categoryY, { maxWidth: exWidth })

    if (ex.exerciseDescription) {
      doc.setFontSize(7.5)
      doc.setTextColor(60)
      const lines = doc.splitTextToSize(ex.exerciseDescription, exWidth).slice(0, maxDescLines)
      doc.text(lines, exX, exY + descStartY)
    }
    doc.setTextColor(20)

    exX += exWidth + exGap
  })

  doc.save(`Trainingseinheit-${input.sessionNumber}.pdf`)
}
