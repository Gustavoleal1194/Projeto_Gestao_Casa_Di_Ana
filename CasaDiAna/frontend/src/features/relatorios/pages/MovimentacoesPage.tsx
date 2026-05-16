import { useEffect, useState, useMemo } from 'react'
import { ArrowDownTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { gerarPdfMovimentacoes } from '@/lib/pdf'
import { FiltrosMovimentacoes } from '../components/FiltrosMovimentacoes'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiMovimentacoes } from '../components/KpiMovimentacoes'
import { ChartMovimentacoes } from '../components/ChartMovimentacoes'
import { StreamAutoScroll } from '../components/StreamAutoScroll'
import type { MovimentacaoRelatorio, IngredienteResumo } from '@/types/estoque'

function hoje(): string { return new Date().toISOString().split('T')[0] }
function ha30Dias(): string {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
}

function useLiveClock() {
  const [hora, setHora] = useState('')
  const [data, setData] = useState('')
  useEffect(() => {
    function tick() {
      const n = new Date()
      setHora(n.toLocaleTimeString('pt-BR'))
      const dias   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
      const meses  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      setData(`${dias[n.getDay()]} · ${String(n.getDate()).padStart(2,'0')} ${meses[n.getMonth()]} ${n.getFullYear()}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return { hora, data }
}

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes]       = useState<MovimentacaoRelatorio[]>([])
  const [ingredientes, setIngredientes]          = useState<IngredienteResumo[]>([])
  const [loading, setLoading]                   = useState(false)
  const [erro, setErro]                         = useState<string | null>(null)
  const [de, setDe]                             = useState(ha30Dias)
  const [ate, setAte]                           = useState(hoje)
  const [tipos, setTipos]                       = useState<string[]>([])
  const [ingredienteIds, setIngredienteIds]     = useState<string[]>([])
  const [busca, setBusca]                       = useState('')
  const { hora, data } = useLiveClock()

  const carregar = async (
    filtroDe = de, filtroAte = ate,
    filtroTipos = tipos, filtroIngredienteIds = ingredienteIds
  ) => {
    setLoading(true); setErro(null)
    try {
      const d = await relatoriosService.movimentacoes(
        filtroDe, filtroAte,
        filtroTipos.length > 0 ? filtroTipos : undefined,
        filtroIngredienteIds.length > 0 ? filtroIngredienteIds : undefined
      )
      setMovimentacoes(d)
    } catch { setErro('Erro ao carregar movimentações.') }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    carregar()
  }, [])

  const handleDeChange           = (v: string)   => { setDe(v);            carregar(v,  ate, tipos, ingredienteIds) }
  const handleAteChange          = (v: string)   => { setAte(v);           carregar(de, v,   tipos, ingredienteIds) }
  const handleTipoChange         = (vs: string[]) => { setTipos(vs);        carregar(de, ate, vs, ingredienteIds) }
  const handleIngredienteChange  = (vs: string[]) => { setIngredienteIds(vs); carregar(de, ate, tipos, vs) }

  const movimentacoesFiltradas = useMemo(() => {
    if (!busca) return movimentacoes
    const t = busca.toLowerCase()
    return movimentacoes.filter(m =>
      m.ingredienteNome.toLowerCase().includes(t) ||
      (m.referenciaTipo ?? '').toLowerCase().includes(t)
    )
  }, [movimentacoes, busca])

  return (
    <div className="ada-page">
      <div
        className="mov-hero-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, alignItems: 'start' }}
      >
        {/* ── LEFT: ops-shell ─────────────────────────── */}
        <div style={{
          background: 'var(--ada-surface)', border: '1px solid var(--ada-border)',
          borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column' as const, gap: 24,
          boxShadow: 'var(--shadow-sm)', minHeight: 'calc(100vh - 140px)',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(212,150,12,.08), transparent 100%)',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'linear-gradient(var(--ada-border-sub) 1px, transparent 1px), linear-gradient(90deg, var(--ada-border-sub) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            opacity: 0.4,
          }} />

          {/* Hero header */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: 'Sora, system-ui, sans-serif', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#D4960C', marginBottom: 12 }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4960C', boxShadow: '0 0 10px rgba(240,176,48,.6)', animation: 'mov-pulse 1.6s ease infinite', display: 'inline-block' }} />
                Operações em tempo real
              </div>
              <h1 style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--ada-heading)' }}>
                Movimentações de <em style={{ fontStyle: 'normal', color: '#D4960C' }}>Estoque</em>
              </h1>
              <p style={{ marginTop: 8, color: 'var(--ada-muted)', fontSize: 13.5, maxWidth: 480, lineHeight: 1.55 }}>
                Cada entrada, saída e ajuste no período selecionado — rastreado ao vivo.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'var(--ada-placeholder)' }}>UTC-3 · ao vivo</span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 22, fontWeight: 600, color: '#D4960C', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' as const, textShadow: '0 0 16px rgba(212,150,12,.30)' }}>{hora}</span>
              <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: 10.5, color: 'var(--ada-muted)', letterSpacing: '0.06em' }}>{data}</span>
            </div>
          </div>

          {/* KPI grid */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {!loading && !erro && movimentacoesFiltradas.length > 0 && (
              <KpiMovimentacoes movimentacoes={movimentacoesFiltradas} />
            )}
          </div>

          {/* Stream / states */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' as const }}>
            {loading && <LoadingState mensagem="Carregando movimentações…" />}
            {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
            {!loading && !erro && movimentacoesFiltradas.length === 0 && (
              <EmptyState
                icon={<ArrowsRightLeftIcon className="w-7 h-7" />}
                iconColor="neutral"
                titulo="Nenhuma movimentação no período"
                descricao="Ajuste os filtros e tente novamente."
              />
            )}
            {!loading && !erro && movimentacoesFiltradas.length > 0 && (
              <StreamAutoScroll movimentacoes={movimentacoesFiltradas} />
            )}
          </div>
        </div>

        {/* ── RIGHT: filters + chart ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20, position: 'sticky', top: 16 }}>
          <FiltrosMovimentacoes
            busca={busca}
            onBuscaChange={setBusca}
            de={de}
            onDeChange={handleDeChange}
            ate={ate}
            onAteChange={handleAteChange}
            tipos={tipos}
            onTipoChange={handleTipoChange}
            ingredienteIds={ingredienteIds}
            onIngredienteChange={handleIngredienteChange}
            ingredientes={ingredientes}
          />

          {!loading && !erro && movimentacoesFiltradas.length > 0 && (
            <ChartMovimentacoes movimentacoes={movimentacoesFiltradas} />
          )}

          {movimentacoes.length > 0 && (
            <button
              onClick={() => gerarPdfMovimentacoes(movimentacoes, de, ate)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Baixar PDF
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
