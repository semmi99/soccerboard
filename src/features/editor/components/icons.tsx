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

export function PolygonShapeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4l8 6-3 9H7l-3-9z" />
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

export function PlainLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 18L20 6" strokeDasharray="3 3" />
    </Base>
  )
}

export function PlayerZoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4l7 5-2.7 9H7.7L5 9z" fill="currentColor" fillOpacity="0.25" />
      <circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="5" cy="9" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function ReleasePassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12h15" />
      <path d="M14 6l6 6-6 6" />
      <circle cx="4" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function BouncePassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 16C4 8 10 6 19 9" strokeDasharray="1.5 3" />
      <path d="M14 5l5 4-4 4" />
      <circle cx="4" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function RunArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12h15" strokeDasharray="2.5 2.5" />
      <path d="M14 6l6 6-6 6" />
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
      <rect x="4" y="7" width="16" height="10" rx="1" />
      <path d="M4 7l16 10" />
      <path d="M20 7L4 17" />
    </Base>
  )
}

export function MannequinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M8 20l1.5-9h5L16 20" />
    </Base>
  )
}

export function SlalomPoleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4v13" />
      <circle cx="12" cy="19" r="2" />
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
