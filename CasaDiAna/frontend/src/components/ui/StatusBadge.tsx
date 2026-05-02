// CasaDiAna/frontend/src/components/ui/StatusBadge.tsx
export type BadgeVariante = 'ativo' | 'inativo' | 'baixo' | 'critico' | 'info'

interface StatusBadgeProps {
  variante: BadgeVariante
  label?: string
}

const config: Record<BadgeVariante, { dot: string; bg: string; border: string; text: string; defaultLabel: string }> = {
  ativo:   { dot: '#4ADE80', bg: 'rgba(74,222,128,.1)',   border: 'rgba(74,222,128,.2)',   text: '#4ADE80', defaultLabel: 'Ativo' },
  inativo: { dot: '#64748B', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.12)', text: '#64748B', defaultLabel: 'Inativo' },
  baixo:   { dot: '#FCD34D', bg: 'rgba(252,211,77,.1)',   border: 'rgba(252,211,77,.2)',   text: '#FCD34D', defaultLabel: 'Baixo' },
  critico: { dot: '#F87171', bg: 'rgba(248,113,113,.1)',  border: 'rgba(248,113,113,.2)',  text: '#F87171', defaultLabel: 'Crítico' },
  info:    { dot: '#93C5FD', bg: 'rgba(147,197,253,.1)',  border: 'rgba(147,197,253,.2)',  text: '#93C5FD', defaultLabel: 'Info' },
}

export function StatusBadge({ variante, label }: StatusBadgeProps) {
  const c = config[variante]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 6, height: 6, background: c.dot }}
        aria-hidden="true"
      />
      {label ?? c.defaultLabel}
    </span>
  )
}
