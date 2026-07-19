import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-violet-accent hover:bg-violet-accent-bright text-white shadow-lg shadow-violet-accent/20',
  secondary:
    'bg-pitch-700 hover:bg-pitch-600 text-white border border-pitch-600',
  ghost: 'bg-transparent hover:bg-pitch-800 text-white/80 hover:text-white',
  danger: 'bg-red-600/90 hover:bg-red-600 text-white',
  brand:
    'bg-brand-yellow hover:brightness-105 text-brand-blue-dark font-semibold shadow-lg shadow-black/20',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
}
