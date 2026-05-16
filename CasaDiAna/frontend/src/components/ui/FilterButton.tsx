import type { ReactNode } from 'react'

interface FilterButtonProps {
  label: string
  icon?: ReactNode
  count?: number
  applied?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export function FilterButton({
  label,
  icon,
  count,
  applied = false,
  onClick,
  type = 'button',
  disabled = false,
}: FilterButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 36,
        padding: '0 14px',
        borderRadius: 10,
        fontFamily: 'Sora, system-ui, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 140ms, border-color 140ms, color 140ms, box-shadow 140ms, transform 80ms',
        outline: 'none',
        ...(applied
          ? {
              background: 'rgba(212,150,12,0.1)',
              border: '1px solid rgba(212,150,12,0.45)',
              color: '#92580A',
              boxShadow: '0 0 0 3px rgba(212,150,12,0.1), var(--shadow-xs)',
            }
          : {
              background: 'var(--ada-surface)',
              border: '1px solid var(--ada-border)',
              color: 'var(--ada-body)',
              boxShadow: 'var(--shadow-xs)',
            }),
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (disabled || applied) return
        const el = e.currentTarget
        el.style.background = 'var(--ada-hover)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        if (disabled || applied) return
        const el = e.currentTarget
        el.style.background = 'var(--ada-surface)'
        el.style.transform = 'translateY(0)'
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {icon && <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            background: applied ? 'rgba(212,150,12,0.2)' : 'var(--ada-surface-2)',
            color: applied ? '#92580A' : 'var(--ada-muted)',
            padding: '0 5px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
