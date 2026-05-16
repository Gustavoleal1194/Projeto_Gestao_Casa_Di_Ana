import type { MovimentacaoRelatorio } from '@/types/estoque'

interface HourBucket { hour: number; entradas: number; saidas: number }

function agruparPorHora(movs: MovimentacaoRelatorio[]): HourBucket[] {
  const map: Record<number, HourBucket> = {}
  for (const m of movs) {
    const h = new Date(m.criadoEm).getHours()
    if (!map[h]) map[h] = { hour: h, entradas: 0, saidas: 0 }
    if (m.tipo === 'Entrada' || m.tipo === 'AjustePositivo') map[h].entradas++
    else map[h].saidas++
  }
  return Object.values(map).sort((a, b) => a.hour - b.hour).slice(-12)
}

export function ChartMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const dados = agruparPorHora(movimentacoes)
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'Entrada' || m.tipo === 'AjustePositivo').length
  const totalSaidas   = movimentacoes.filter(m => m.tipo === 'SaidaProducao' || m.tipo === 'AjusteNegativo').length

  const W = 600, H = 140, PAD = 10
  const barW   = dados.length > 0 ? (W - PAD * 2) / dados.length : 40
  const innerW = barW * 0.32
  const gap    = 3
  const max    = Math.max(...dados.flatMap(d => [d.entradas, d.saidas]), 1) + 2

  const LEGEND = [
    { color: '#D4960C', label: 'Entradas & Ajust.+' },
    { color: '#A78BFA', label: 'Saídas & Ajust.-' },
  ]

  const FOOTER = [
    { label: 'Entradas & Ajust.+', value: totalEntradas, color: '#D4960C' },
    { label: 'Saídas & Ajust.-',   value: totalSaidas,   color: '#A78BFA' },
  ]

  return (
    <div style={{
      background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
      borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', flex: 1,
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(212,150,12,.06), transparent 100%)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Movimentação por hora
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' as const }}>
            {movimentacoes.length.toLocaleString('pt-BR')}
            <span style={{ fontSize: 13, color: 'var(--ada-muted)', fontWeight: 500, marginLeft: 6 }}>movimentações</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, alignItems: 'flex-end' }}>
          {LEGEND.map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {dados.length > 0 ? (
        <div style={{ position: 'relative', height: 140 }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="barInMov" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#FFC857" />
                <stop offset="1" stopColor="#D4960C" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="barOutMov" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#A78BFA" />
                <stop offset="1" stopColor="#7C3AED" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {[30, 70, 110].map(y => (
              <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--ada-border-sub)" strokeDasharray="2 4" />
            ))}
            {dados.map((d, i) => {
              const cx   = PAD + i * barW + barW / 2
              const hIn  = (d.entradas / max) * (H - 20)
              const hOut = (d.saidas   / max) * (H - 20)
              return (
                <g key={d.hour}>
                  <rect x={cx - innerW - gap / 2} y={H - 15 - hIn}  width={innerW} height={hIn}  rx={2} fill="url(#barInMov)">
                    <animate attributeName="height" from="0" to={hIn}  dur="800ms" fill="freeze" begin={`${i * 40}ms`}      calcMode="spline" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y"      from={H - 15} to={H - 15 - hIn}  dur="800ms" fill="freeze" begin={`${i * 40}ms`}      calcMode="spline" keySplines="0.4 0 0.2 1" />
                  </rect>
                  <rect x={cx + gap / 2} y={H - 15 - hOut} width={innerW} height={hOut} rx={2} fill="url(#barOutMov)">
                    <animate attributeName="height" from="0" to={hOut} dur="800ms" fill="freeze" begin={`${i * 40 + 80}ms`} calcMode="spline" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y"      from={H - 15} to={H - 15 - hOut} dur="800ms" fill="freeze" begin={`${i * 40 + 80}ms`} calcMode="spline" keySplines="0.4 0 0.2 1" />
                  </rect>
                  <text x={cx} y={H - 2} textAnchor="middle"
                    style={{ fontSize: 9, fill: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '0.08em' }}>
                    {String(d.hour).padStart(2, '0')}h
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      ) : (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ada-muted)', fontSize: 13 }}>
          Sem dados no período
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ada-border-sub)' }}>
        {FOOTER.map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 9.5, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color, fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const }}>
              {value.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
