import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { MovimentacaoRelatorio } from '@/types/estoque'

const TIPO_LABEL: Record<string, string> = {
  Entrada:        'Entrada',
  AjustePositivo: 'Ajuste Positivo',
  AjusteNegativo: 'Ajuste Negativo',
  SaidaProducao:  'Saída — Produção',
}

interface TipoVis {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  iconColor: string
  iconBg: string
  badgeBg: string
  badgeColor: string
  sinal: '+' | '-'
  valorColor: string
}

const TIPO_VIS: Record<string, TipoVis> = {
  Entrada:        { Icon: ArrowUpIcon,   iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,.12)',  badgeBg: 'rgba(74,222,128,.1)',  badgeColor: '#16A34A', sinal: '+', valorColor: '#4ADE80'  },
  AjustePositivo: { Icon: ArrowUpIcon,   iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.12)', badgeBg: 'rgba(212,150,12,.1)', badgeColor: '#92580A', sinal: '+', valorColor: '#D4960C'  },
  AjusteNegativo: { Icon: ArrowDownIcon, iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.12)', badgeBg: 'rgba(212,150,12,.1)', badgeColor: '#92580A', sinal: '-', valorColor: '#F87171'  },
  SaidaProducao:  { Icon: ArrowDownIcon, iconColor: '#F87171', iconBg: 'rgba(248,113,113,.12)', badgeBg: 'rgba(220,38,38,.1)',  badgeColor: '#DC2626', sinal: '-', valorColor: '#F87171'  },
}

const FALLBACK_VIS: TipoVis = {
  Icon: ArrowUpIcon,
  iconColor: 'var(--ada-muted)', iconBg: 'var(--ada-surface-2)',
  badgeBg: 'var(--ada-surface-2)', badgeColor: 'var(--ada-muted)',
  sinal: '+', valorColor: 'var(--ada-body)',
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarDataGrupo(isoDate: string): string {
  const [y, mo, d] = isoDate.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

function agruparPorData(movs: MovimentacaoRelatorio[]): [string, MovimentacaoRelatorio[]][] {
  const map = new Map<string, MovimentacaoRelatorio[]>()
  for (const m of movs) {
    const key = m.criadoEm.split('T')[0]
    const arr = map.get(key)
    if (arr) arr.push(m)
    else map.set(key, [m])
  }
  return Array.from(map.entries())
}

function StreamItem({ m, isLast }: { m: MovimentacaoRelatorio; isLast: boolean }) {
  const vis = TIPO_VIS[m.tipo] ?? FALLBACK_VIS
  const { Icon } = vis
  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--ada-border-sub)',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: vis.iconBg, marginTop: 2,
        }}
      >
        <Icon style={{ width: 16, height: 16, color: vis.iconColor, strokeWidth: 2.5 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              fontSize: 14, fontWeight: 600, color: 'var(--ada-heading)',
              fontFamily: 'Sora, system-ui, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {m.ingredienteNome}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ada-placeholder)', marginLeft: 5 }}>
              ({m.unidadeMedidaCodigo})
            </span>
          </span>
          <span
            style={{
              fontSize: 14, fontWeight: 700, color: vis.valorColor,
              fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            {vis.sinal}{m.quantidade}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              background: vis.badgeBg, color: vis.badgeColor, whiteSpace: 'nowrap',
            }}
          >
            {TIPO_LABEL[m.tipo] ?? m.tipo}
          </span>
          {m.referenciaTipo && (
            <span
              style={{
                fontSize: 12, color: 'var(--ada-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              · {m.referenciaTipo}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--ada-muted)' }}>
            Saldo após:{' '}
            <strong style={{ color: 'var(--ada-body)', fontVariantNumeric: 'tabular-nums' }}>
              {m.saldoApos} {m.unidadeMedidaCodigo}
            </strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', fontVariantNumeric: 'tabular-nums' }}>
            {formatarHora(m.criadoEm)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function StreamMovimentacoes({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const grupos = agruparPorData(movimentacoes)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {grupos.map(([data, itens]) => (
        <div key={data}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--ada-muted)',
                fontFamily: 'Sora, system-ui, sans-serif', whiteSpace: 'nowrap',
              }}
            >
              {formatarDataGrupo(data)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              · {itens.length} movimentação{itens.length !== 1 ? 'ões' : ''}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--ada-border-sub)' }} aria-hidden="true" />
          </div>

          <div
            style={{
              background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
              borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}
          >
            {itens.map((m, i) => (
              <StreamItem key={m.id} m={m} isLast={i === itens.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
