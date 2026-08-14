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
// Print-legible version of the app's on-screen violet-accent (#ffe100) —
// that bright yellow reads fine on the app's dark background but nearly
// disappears on white paper, so the accent is darkened for print use.
const ACCENT_RGB: [number, number, number] = [184, 134, 11]

/** Builds an actual downloadable A4-landscape PDF with jsPDF instead of
 * relying on the browser's print dialog (window.print() left it up to the
 * user to notice/pick "Save as PDF", and some browsers' popup blockers
 * broke an earlier window.open()-based attempt entirely). Each exercise
 * box embeds the real diagram (via addImage) plus its wrapped description
 * — v1 shipped text-only, but that turned out not to be usable on its
 * own: a coach needs to see the actual pitch diagram to run the drill. */
export function downloadSessionPdf(input: PdfSessionInput): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  let y = 11
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ACCENT_RGB)
  doc.text('— TRAININGSEINHEIT', MARGIN_X, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20)

  y += 7
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Trainingseinheit ${input.sessionNumber}`, MARGIN_X, y)
  doc.setFont('helvetica', 'normal')

  y += 6
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${input.teamName} · ${input.sessionDate}`, MARGIN_X, y)
  doc.setTextColor(20)

  // Stat-card row: big number + small caption, mirroring the reference's
  // "9.0m / SHUT" cards — the numeric metrics get this treatment,
  // the categorical fields (Schwerpunkt etc.) stay as plain text below.
  y += 6
  const activeCount = input.players.filter((p) => p.status === 'aktiv').length
  const stats: [string, string][] = [
    [`${input.koerperlich}/10`, 'KÖRPERLICH'],
    [`${input.physisch}/10`, 'PHYSISCH'],
    [`${input.exercises.length}`, 'ÜBUNGEN'],
    [`${activeCount}/${input.players.length}`, 'KADER AKTIV'],
  ]
  const cardGap = 4
  const cardWidth = (PAGE_WIDTH - MARGIN_X * 2 - cardGap * 3) / 4
  const cardHeight = 17
  stats.forEach(([value, label], i) => {
    const cardX = MARGIN_X + i * (cardWidth + cardGap)
    doc.setDrawColor(210)
    doc.rect(cardX, y, cardWidth, cardHeight)
    doc.setFillColor(...ACCENT_RGB)
    doc.rect(cardX, y, cardWidth, 1.2, 'F')
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20)
    doc.text(value, cardX + cardWidth / 2, y + 9, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110)
    doc.text(label, cardX + cardWidth / 2, y + 14, { align: 'center' })
  })
  doc.setTextColor(20)
  y += cardHeight + 5

  doc.setFontSize(9)
  doc.text(
    `Schwerpunkt: ${input.schwerpunkt}   ·   Spielphase: ${input.spielphase}`,
    MARGIN_X,
    y,
  )
  y += 5
  doc.text(
    `Unterphase: ${input.unterphaseName ?? '–'}   ·   Prinzip: ${input.prinzipName ?? '–'}`,
    MARGIN_X,
    y,
  )
  y += 5

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
