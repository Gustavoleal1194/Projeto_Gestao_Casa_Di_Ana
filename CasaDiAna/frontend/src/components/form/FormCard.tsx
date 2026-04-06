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
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}
