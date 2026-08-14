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
const PAGE_HEIGHT = 210
const MARGIN_X = 12

/** Builds an actual downloadable A4-landscape PDF with jsPDF instead of
 * relying on the browser's print dialog (window.print() left it up to the
 * user to notice/pick "Save as PDF", and some browsers' popup blockers
 * broke an earlier window.open()-based attempt entirely). */
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
    doc.text(right, MARGIN_X + 75, y)
    y += 5
  }
  y += 4

  const tableWidth = 130
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_X },
    tableWidth,
    head: [['Spieler', 'Position', 'Status']],
    body: input.players.map((p) => [p.name, p.position ?? '', STATUS_LABELS[p.status]]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
  })

  const exColX = MARGIN_X + tableWidth + 10
  const exGap = 4
  const exWidth = (PAGE_WIDTH - exColX - MARGIN_X - exGap) / 2
  const boxHeight = 32
  let exX = exColX
  let exY = y

  input.exercises.forEach((ex, i) => {
    if (i > 0 && i % 2 === 0) {
      exX = exColX
      exY += boxHeight + exGap
    }
    if (exY + boxHeight > PAGE_HEIGHT - MARGIN_X) {
      exX = exColX
      exY = y
    }

    doc.setDrawColor(200)
    doc.rect(exX, exY, exWidth, boxHeight)

    doc.setFontSize(9)
    doc.setTextColor(20)
    doc.text(ex.exerciseName, exX + 2, exY + 5, { maxWidth: exWidth - 4 })

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(ex.exerciseCategory, exX + 2, exY + 10, { maxWidth: exWidth - 4 })

    if (ex.exerciseDescription) {
      doc.setTextColor(60)
      doc.text(ex.exerciseDescription, exX + 2, exY + 15, { maxWidth: exWidth - 4 })
    }
    doc.setTextColor(20)

    exX += exWidth + exGap
  })

  doc.save(`Trainingseinheit-${input.sessionNumber}.pdf`)
}
