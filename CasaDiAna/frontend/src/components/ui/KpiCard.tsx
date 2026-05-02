// CasaDiAna/frontend/src/components/ui/KpiCard.tsx
export type KpiVariante = 'amber' | 'green' | 'yellow' | 'blue'

interface KpiCardProps {
  valor: string | number
  label: string
  tendencia?: string
  variante?: KpiVariante
}

const varConfig: Record<KpiVariante, { color: string; glow: string; gradient: string }> = {
  amber:  { color: '#D4960C', glow: 'rgba(212,150,12,.4)',  gradient: 'rgba(212,150,12,.12)' },
  green:  { color: '#4ADE80', glow: 'rgba(74,222,128,.4)',  gradient: 'rgba(74,222,128,.12)' },
  yellow: { color: '#FCD34D', glow: 'rgba(252,211,77,.4)',  gradient: 'rgba(252,211,77,.12)' },
  blue:   { color: '#93C5FD', glow: 'rgba(147,197,253,.4)', gradient: 'rgba(147,197,253,.12)' },
}

export function KpiCard({ valor, label, tendencia, variante = 'amber' }: KpiCardProps) {
  const v = varConfig[variante]
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,.025)',
        border: '1px solid rgba(255,255,255,.07)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Linha de gradiente no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${v.gradient} 0%, ${v.color} 50%, ${v.gradient} 100%)` }}
        aria-hidden="true"
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[.08em] mb-2"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ color: v.color, textShadow: `0 0 24px ${v.glow}`, fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {valor}
      </p>
      {tendencia && (
        <p className="text-xs mt-2" style={{ color: 'var(--ada-muted)' }}>
          {tendencia}
        </p>
      )}
    </div>
  )
}
