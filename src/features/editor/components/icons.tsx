import type { SVGProps } from 'react'

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  )
}

export function CursorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 3l14 8-6 1.5L11 19z" />
    </Base>
  )
}

export function StraightArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12h15" />
      <path d="M14 6l6 6-6 6" />
    </Base>
  )
}

export function CurvedArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 19c2-8 8-13 15-13" />
      <path d="M13 4l6 2-2 6" />
    </Base>
  )
}

export function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 20l1-4.5L15.5 5A2.1 2.1 0 0 1 19 8.5L8.5 19 4 20z" />
      <path d="M13 7l4 4" />
    </Base>
  )
}

export function TeamLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 12h3M9 12h3M15 12h3M21 12h0" strokeDasharray="0.1 5" />
      <path d="M3 6h18M3 18h18" opacity={0.35} />
    </Base>
  )
}

export function CircleShapeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
    </Base>
  )
}

export function RectShapeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
    </Base>
  )
}

export function TextToolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 5h14" />
      <path d="M12 5v14" />
    </Base>
  )
}

export function QuoteCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8.5h6" strokeWidth={2.4} />
      <path d="M7 13h10M7 16h7" />
    </Base>
  )
}

export function BallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8l3 2-1 4h-4l-1-4z" />
    </Base>
  )
}

export function ConnectorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="5.5" cy="6" r="2.2" />
      <circle cx="18.5" cy="18" r="2.2" />
      <path d="M7.2 7.7l9.6 8.6" strokeDasharray="2.5 2.5" />
    </Base>
  )
}

export function ImageInsertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="M3 17l5-5 4 4 4-5 5 6" />
    </Base>
  )
}

export function TraceImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" opacity={0.4} />
      <circle cx="9" cy="10" r="1.75" opacity={0.4} />
      <path d="M3 17l5-5 4 4 4-5 5 6" opacity={0.4} />
      <path d="M8 21l10-14" strokeDasharray="2.5 2.5" />
    </Base>
  )
}

export function ConeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4l5 14H7z" />
      <path d="M6 18h12" />
    </Base>
  )
}

export function MiniGoalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 7l3-3h10l3 3" />
      <rect x="4" y="7" width="16" height="10" rx="1" />
      <path d="M9 7v10M15 7v10M4 11h16" opacity="0.5" />
    </Base>
  )
}

export function MannequinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="3.3" r="1.3" />
      <path d="M12 4.6v0.9" />
      <path d="M9.7 5.5c-1.2.8-1.7 1.8-1.7 3v6.5c0 1.4.4 2.5 1 3.4l.3.4h5.4l.3-.4c.6-.9 1-2 1-3.4V8.5c0-1.2-.5-2.2-1.7-3" />
      <path d="M8.3 9l6.4 7.2M15.7 9l-6.4 7.2" />
      <path d="M9.5 19v2M12 19.2v2.1M14.5 19v2" />
    </Base>
  )
}

export function SlalomPoleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4v16" />
    </Base>
  )
}

export function LadderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M9 8v8" />
      <path d="M15 8v8" />
    </Base>
  )
}

export function RingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="7" strokeWidth={3} />
    </Base>
  )
}
