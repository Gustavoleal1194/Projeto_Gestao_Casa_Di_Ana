// frontend/src/components/ui/InfoRow.tsx
import type { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
  icon?: ReactNode
}

export function InfoRow({ label, children, icon }: Props) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--ada-border)' }}>
      {icon && (
        <span className="mt-0.5 shrink-0" style={{ color: 'var(--ada-muted)' }}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
          style={{ color: 'var(--ada-muted)' }}>
          {label}
        </p>
        <div className="text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
