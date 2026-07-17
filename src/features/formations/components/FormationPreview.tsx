import type { FormationPosition } from '../presets'

export function FormationPreview({ positions }: { positions: FormationPosition[] }) {
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full">
      <rect x={1} y={1} width={98} height={138} fill="#123a1e" stroke="#ffffff40" strokeWidth={1} />
      <line x1={1} y1={70} x2={99} y2={70} stroke="#ffffff40" strokeWidth={1} />
      <circle cx={50} cy={70} r={12} fill="none" stroke="#ffffff40" strokeWidth={1} />
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={p.x * 100} cy={(1 - p.y) * 140} r={6} fill="#7c3aed" stroke="#ffffff" strokeWidth={1} />
          <text
            x={p.x * 100}
            y={(1 - p.y) * 140 + 2.5}
            fontSize={5}
            fill="#ffffff"
            textAnchor="middle"
          >
            {p.role}
          </text>
        </g>
      ))}
    </svg>
  )
}
