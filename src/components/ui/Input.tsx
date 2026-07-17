import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className = '', ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-white/70">{label}</span>
      <input
        id={id}
        className={`rounded-lg border border-pitch-600 bg-pitch-900 px-3.5 py-2.5 text-white placeholder:text-white/30 outline-none transition-colors focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 ${className}`}
        {...rest}
      />
    </label>
  )
}
