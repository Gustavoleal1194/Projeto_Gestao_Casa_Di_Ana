import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { MovimentacaoRelatorio } from '@/types/estoque'

type Tab = 'todas' | 'entradas' | 'saidas' | 'ajustes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'todas',    label: 'Todas'    },
  { id: 'entradas', label: 'Entradas' },
  { id: 'saidas',   label: 'Saídas'   },
  { id: 'ajustes',  label: 'Ajustes'  },
]

interface RowVis {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  iconColor: string
  iconBg: string
  sinal: '+' | '-'
  valorColor: string
  badgeLabel: string
}

const ROW_VIS: Record<string, RowVis> = {
  Entrada:        { Icon: ArrowUpIcon,   iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,.14)',  sinal: '+', valorColor: '#4ADE80', badgeLabel: 'Entrada'        },
  AjustePositivo: { Icon: ArrowUpIcon,   iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.14)',  sinal: '+', valorColor: '#D4960C', badgeLabel: 'Ajuste +'       },
  AjusteNegativo: { Icon: ArrowDownIcon, iconColor: '#D4960C', iconBg: 'rgba(212,150,12,.14)',  sinal: '-', valorColor: '#F87171', badgeLabel: 'Ajuste −'       },
  SaidaProducao:  { Icon: ArrowDownIcon, iconColor: '#F87171', iconBg: 'rgba(248,113,113,.14)', sinal: '-', valorColor: '#F87171', badgeLabel: 'Saída Produção' },
}

const FALLBACK_ROW: RowVis = {
  Icon: ArrowUpIcon, iconColor: 'var(--ada-muted)', iconBg: 'var(--ada-surface-2)',
  sinal: '+', valorColor: 'var(--ada-body)', badgeLabel: '—',
}

function formatData(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function StreamRow({ m }: { m: MovimentacaoRelatorio }) {
  const vis = ROW_VIS[m.tipo] ?? FALLBACK_ROW
  const { Icon } = vis
  return (
    <li
      style={{
        display: 'grid', gridTemplateColumns: '56px 28px 1fr auto',
        gap: 12, alignItems: 'center', padding: '9px 18px',
        borderLeft: '2px solid transparent',
        transition: 'background 120ms, border-color 120ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLLIElement
        el.style.background = 'var(--ada-hover)'
        el.style.borderLeftColor = '#D4960C'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLLIElement
        el.style.background = 'transparent'
        el.style.borderLeftColor = 'transparent'
      }}
    >
      {/* Data + hora em duas linhas */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
        <span style={{ fontSize: 9.5, color: 'var(--ada-placeholder)', fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' as const }}>
          {formatData(m.criadoEm)}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const, letterSpacing: '0.04em' }}>
          {formatHora(m.criadoEm)}
        </span>
      </div>

      <div aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: vis.iconBg, flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color: vis.iconColor, strokeWidth: 2.5 }} />
      </div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <span style={{ fontSize: 13, color: 'var(--ada-heading)', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
          <span style={{ color: 'var(--ada-muted)', marginRight: 4 }}>{vis.badgeLabel} ·</span>
          {m.ingredienteNome}
          <span style={{ fontSize: 11, color: 'var(--ada-placeholder)', marginLeft: 4 }}>({m.unidadeMedidaCodigo})</span>
        </span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: vis.valorColor, fontFamily: 'Sora, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' as const, flexShrink: 0 }}>
        {vis.sinal}{m.quantidade}
      </span>
    </li>
  )
}

export function StreamAutoScroll({ movimentacoes }: { movimentacoes: MovimentacaoRelatorio[] }) {
  const [tab, setTab]       = useState<Tab>('todas')
  const [paused, setPaused] = useState(false)
  const bodyRef  = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = useMemo(() => {
    const sorted = [...movimentacoes].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    if (tab === 'todas')    return sorted
    if (tab === 'entradas') return sorted.filter(m => m.tipo === 'Entrada')
    if (tab === 'saidas')   return sorted.filter(m => m.tipo === 'SaidaProducao')
    return sorted.filter(m => m.tipo === 'AjustePositivo' || m.tipo === 'AjusteNegativo')
  }, [movimentacoes, tab])

  const shouldScroll = filtered.length > 5

  const scheduleResume = useCallback(() => {
    setPaused(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = 0
      setPaused(false)
    }, 10_000)
  }, [])

  // Hover: vai pro topo e pausa
  const handleMouseEnter = useCallback(() => {
    if (!shouldScroll) return
    if (bodyRef.current) bodyRef.current.scrollTop = 0
    scheduleResume()
  }, [shouldScroll, scheduleResume])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const items = shouldScroll && !paused ? [...filtered, ...filtered] : filtered

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, background: 'var(--ada-surface-2)', border: '1px solid var(--ada-border-sub)', borderRadius: 16, overflow: 'hidden', minHeight: 320 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--ada-border-sub)' }}>
        <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ada-body)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-label={paused ? 'pausado' : 'ao vivo'}
            style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: paused ? '#D4960C' : '#4ADE80',
              boxShadow: paused ? '0 0 8px #D4960C' : '0 0 8px #4ADE80',
              animation: paused ? 'none' : 'stream-pulse 1.6s ease infinite',
              transition: 'background 300ms, box-shadow 300ms',
            }}
          />
          {paused ? 'Navegação manual' : 'Stream de operações'}
        </span>
        <div style={{ display: 'flex', gap: 4, padding: 2, background: 'var(--ada-surface)', border: '1px solid var(--ada-border)', borderRadius: 8 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: 11.5, fontWeight: 500,
                background: tab === t.id ? 'var(--ada-surface-2)' : 'transparent',
                color: tab === t.id ? '#D4960C' : 'var(--ada-muted)',
                transition: 'all 150ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stream body */}
      <div
        ref={bodyRef}
        onMouseEnter={shouldScroll ? handleMouseEnter : undefined}
        onScroll={shouldScroll ? scheduleResume : undefined}
        style={{
          flex: 1,
          overflowY: paused ? 'auto' : 'hidden',
          position: 'relative',
          maskImage: paused
            ? undefined
            : 'linear-gradient(180deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)',
          WebkitMaskImage: paused
            ? undefined
            : 'linear-gradient(180deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' as const, color: 'var(--ada-muted)', fontSize: 13 }}>
            Nenhuma movimentação nesta categoria.
          </div>
        ) : (
          <ul
            className={shouldScroll && !paused ? 'stream-auto-list-scroll' : undefined}
            style={{ listStyle: 'none', padding: '8px 0', display: 'flex', flexDirection: 'column' as const }}
          >
            {items.map((m, i) => <StreamRow key={`${m.id}-${i}`} m={m} />)}
          </ul>
        )}
      </div>
    </div>
  )
}
