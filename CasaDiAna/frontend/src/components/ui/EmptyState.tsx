import type { ReactNode } from 'react'

type IconColor = 'amber' | 'green' | 'red' | 'blue' | 'neutral'

interface EmptyStateProps {
  icon: ReactNode
  iconColor?: IconColor
  titulo: string
  descricao?: string
  action?: ReactNode
}

const colorMap: Record<IconColor, { bg: string; color: string }> = {
  amber:   { bg: 'var(--ada-warning-badge)',  color: 'var(--ada-warning-text)' },
  green:   { bg: 'var(--ada-success-bg)',     color: 'var(--ada-success-text)' },
  red:     { bg: 'var(--ada-error-bg)',       color: 'var(--ada-error-text)' },
  blue:    { bg: '#EFF6FF',                   color: '#2563EB' },
  neutral: { bg: 'var(--ada-bg)',             color: 'var(--ada-muted)' },
}

export function EmptyState({ icon, iconColor = 'neutral', titulo, descricao, action }: EmptyStateProps) {
  const { bg, color } = colorMap[iconColor]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: bg, border: '1px solid var(--ada-border)' }}
        aria-hidden="true"
      >
        <span style={{ color }} className="w-7 h-7 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <div className="space-y-1">
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          {titulo}
        </p>
        {descricao && (
          <p className="text-xs max-w-xs" style={{ color: 'var(--ada-muted)' }}>
            {descricao}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
