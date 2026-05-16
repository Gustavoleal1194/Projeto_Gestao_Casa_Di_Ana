import { useEffect, useRef, useState } from 'react'

export type KpiVariante = 'amber' | 'green' | 'yellow' | 'blue' | 'red'

interface KpiCardProps {
  valor: string
  raw?: number
  formatarValor?: (n: number) => string
  label: string
  tendencia?: string
  variante?: KpiVariante
}

const varConfig: Record<KpiVariante, { color: string; glow: string; gradient: string }> = {
  amber: { color: '#D4960C', glow: 'rgba(212,150,12,.4)',  gradient: 'rgba(212,150,12,.12)' },
  green: { color: '#4ADE80', glow: 'rgba(74,222,128,.4)',  gradient: 'rgba(74,222,128,.12)' },
  yellow:{ color: '#FCD34D', glow: 'rgba(252,211,77,.4)',  gradient: 'rgba(252,211,77,.12)' },
  blue:  { color: '#93C5FD', glow: 'rgba(147,197,253,.4)', gradient: 'rgba(147,197,253,.12)' },
  red:   { color: '#F87171', glow: 'rgba(248,113,113,.4)', gradient: 'rgba(248,113,113,.12)' },
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const DURATION = 1100

export function KpiCard({ valor, raw, formatarValor, label, tendencia, variante = 'amber' }: KpiCardProps) {
  const v = varConfig[variante]
  const [displayed, setDisplayed] = useState<string>(raw !== undefined ? (formatarValor ? formatarValor(0) : '0') : valor)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (raw === undefined) {
      setDisplayed(valor)
      return
    }
    const target = raw
    const fmt = formatarValor ?? ((n: number) => String(Math.round(n)))

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    startRef.current = null
    setDisplayed(fmt(0))

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / DURATION, 1)
      const current = easeOutCubic(progress) * target
      setDisplayed(fmt(current))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(valor)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [raw, valor, formatarValor])

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--ada-surface)',
        border: '1px solid var(--ada-border)',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'Sora, system-ui, sans-serif',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${v.gradient} 0%, ${v.color} 50%, ${v.gradient} 100%)` }}
        aria-hidden="true"
      />
      <p
        className="text-[11px] font-semibold uppercase tracking-[.08em] mb-3"
        style={{ color: 'var(--ada-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-[26px] font-bold tabular-nums leading-none tracking-tight"
        style={{ color: v.color, textShadow: `0 0 20px ${v.glow}` }}
        aria-live="polite"
      >
        {displayed}
      </p>
      {tendencia && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ada-muted)' }}>
          {tendencia}
        </p>
      )}
    </div>
  )
}
