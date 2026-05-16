import { useEffect, useRef } from 'react'
import type { MovimentacaoRelatorio } from '@/types/estoque'

function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    let start: number | null = null
    function step(ts: number) {
      if (!start) start = ts
      const t = Math.min((ts - start) / 1100, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = Math.round(eased * target).toLocaleString('pt-BR')
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return ref
}

const SPARKLINE: Record<string, string> = {
  amber:  'M0 22 L12 20 L24 18 L36 16 L48 17 L60 12 L72 14 L84 8 L100 5',
  green:  'M0 22 L12 18 L24 20 L36 14 L48 12 L60 10 L72 8 L84 9 L100 4',
  blue:   'M0 20 L12 18 L24 22 L36 14 L48 15 L60 10 L72 12 L84 6 L100 8',
  red:    'M0 18 L12 22 L24 17 L36 23 L48 18 L60 21 L72 15 L84 18 L100 12',
}

const COLOR: Record<string, string> = {
  amber: '#D4960C',
  green: '#4ADE80',
  blue:  '#60A5FA',
  red:   '#F87171',
}

interface CardProps {
  label: string
  value: number
  delta: string
  variante: 'amber' | 'green' | 'blue' | 'red'
}

function KpiCard({ label, value, delta, variante }: CardProps) {
  const ref = useCountUp(value)
  const color = COLOR[variante]
  return (
    <div style={{
      position: 'relative', padding: '14px 16px',
      background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.7,
      }} />
      <div style={{
        fontSize: 9.5, fontWeight: 500, textTransform: 'uppercase' as const,
        letterSpacing: '0.14em', color: 'var(--ada-muted)',
        fontFamily: 'Sora, system-ui, sans-serif', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--ada-heading)',
        fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums' as const, lineHeight: 1,
      }}>
        <span ref={ref}>0</span>
      </div>
      <div style={{
        marginTop: 6, fontSize: 10.5, color,
        fontFamily: 'Sora, system-ui, sans-serif',
      }}>
        {delta}
      </div>
      <svg
        viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, opacity: 0.35 }}
      >
        <path d={SPARKLINE[variante]} stroke={color} strokeWidth={1.5} fill="none" />
      </svg>
    </div>
  )
}

export function KpiMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const total    = movimentacoes.length
  const entradas = movimentacoes.filter(m => m.tipo === 'Entrada').length
  const saidas   = movimentacoes.filter(m => m.tipo === 'SaidaProducao').length
  const ajustes  = movimentacoes.filter(m => m.tipo === 'AjustePositivo' || m.tipo === 'AjusteNegativo').length
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      <KpiCard label="Total"           value={total}    delta="no período"           variante="amber" />
      <KpiCard label="Entradas"        value={entradas} delta="ingredientes"          variante="green" />
      <KpiCard label="Saídas Produção" value={saidas}   delta="itens baixados"        variante="blue"  />
      <KpiCard label="Ajustes"         value={ajustes}  delta="positivos + negativos" variante="red"   />
    </div>
  )
}
