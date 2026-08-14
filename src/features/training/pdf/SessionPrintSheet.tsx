import type { CSSProperties } from 'react'
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

export interface SessionPrintSheetProps {
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

const STATUS_COLORS: Record<PlayerStatus, string> = {
  aktiv: '#111',
  individuell: '#a16207',
  krank: '#b91c1c',
}

const thStyle: CSSProperties = {
  border: '1px solid #ccc',
  padding: '4px 6px',
  textAlign: 'left',
  background: '#f0f0f0',
}
const tdStyle: CSSProperties = { border: '1px solid #ccc', padding: '4px 6px', textAlign: 'left' }

/** Rendered inline (hidden on screen, shown only via the @media print rule
 * in index.css) and printed with a plain window.print() call instead of
 * opening a popup window — some browsers silently block a new
 * window.open() + document.write(), which made "Als PDF speichern" appear
 * to do nothing. Printing the current page's own DOM has no such blocker
 * to trip over. Explicit black-on-white inline styles here since this is
 * meant for paper, independent of the app's dark theme. */
export function SessionPrintSheet({
  sessionNumber,
  sessionDate,
  teamName,
  schwerpunkt,
  spielphase,
  unterphaseName,
  prinzipName,
  koerperlich,
  physisch,
  players,
  exercises,
}: SessionPrintSheetProps) {
  return (
    <div
      id="training-print-sheet"
      className="hidden print:block"
      style={{ background: '#fff', color: '#111', fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>Trainingseinheit {sessionNumber}</h1>
      <p style={{ fontSize: 12, color: '#555', margin: '0 0 16px' }}>
        {teamName} · {sessionDate}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
              <div>
                <strong>Schwerpunkt:</strong> {schwerpunkt}
              </div>
              <div>
                <strong>Spielphase:</strong> {spielphase}
              </div>
              <div>
                <strong>Unterphase:</strong> {unterphaseName ?? '–'}
              </div>
              <div>
                <strong>Prinzip:</strong> {prinzipName ?? '–'}
              </div>
              <div>
                <strong>Körperlich:</strong> {koerperlich}/10
              </div>
              <div>
                <strong>Physisch:</strong> {physisch}/10
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={thStyle}>Spieler</th>
                <th style={thStyle}>Position</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.name}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.position ?? ''}</td>
                  <td style={{ ...tdStyle, color: STATUS_COLORS[p.status], fontWeight: p.status === 'aktiv' ? 400 : 600 }}>
                    {STATUS_LABELS[p.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {exercises.map((ex, i) => (
            <div key={i} style={{ border: '1px solid #ccc', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
              <h3 style={{ margin: '0 0 2px', fontSize: 12 }}>{ex.exerciseName}</h3>
              <p style={{ margin: '0 0 4px', color: '#555' }}>{ex.exerciseCategory}</p>
              {ex.exerciseDescription && <p style={{ margin: 0, color: '#333' }}>{ex.exerciseDescription}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
