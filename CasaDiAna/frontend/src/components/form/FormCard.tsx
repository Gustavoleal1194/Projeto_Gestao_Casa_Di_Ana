import type { ReactNode } from 'react'

interface FormCardProps {
  children: ReactNode
  className?: string
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'rgba(255,255,255,.025)',
        border: '1px solid rgba(255,255,255,.07)',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  )
}
