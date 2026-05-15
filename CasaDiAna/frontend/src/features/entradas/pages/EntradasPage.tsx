import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { useEntradas } from '../hooks/useEntradas'
import { useAuthStore } from '@/store/authStore'
import { FiltrosEntradas } from '../components/FiltrosEntradas'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function BadgeStatus({ status }: { status: string }) {
  if (status === 'Confirmada') return <StatusBadge variante="ativo" label={status} />
  if (status === 'Cancelada') return <StatusBadge variante="critico" label={status} />
  return <StatusBadge variante="baixo" label={status} />
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dataVencimento)
  venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function BadgeBoleto({ dataVencimento }: { dataVencimento: string | null }) {
  if (!dataVencimento) return <span style={{ color: 'var(--ada-muted)' }}>—</span>

  const dias = diasParaVencer(dataVencimento)
  const label = new Date(dataVencimento).toLocaleDateString('pt-BR')

  if (dias <= 0) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
        background: 'rgba(220,38,38,.12)', color: '#DC2626',
        border: '1px solid rgba(220,38,38,.25)',
      }}>
        {label} · vencido
      </span>
    )
  }
  if (dias <= 3) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
        background: 'rgba(220,38,38,.12)', color: '#DC2626',
        border: '1px solid rgba(220,38,38,.25)',
      }}>
        {label} · {dias}d
      </span>
    )
  }
  if (dias <= 7) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
        background: 'rgba(240,176,48,.12)', color: '#C4870A',
        border: '1px solid rgba(240,176,48,.28)',
      }}>
        {label} · {dias}d
      </span>
    )
  }
  return (
    <span style={{ fontSize: 12.5, color: 'var(--ada-body)' }}>
      {label}
    </span>
  )
}

export function EntradasPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { entradas, loading, erro, de, ate, atualizarDe, atualizarAte, carregar } = useEntradas()
  const podeCriar = temPapel(...PAPEIS_EDICAO)

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')

  const boletosVencendo = useMemo(() =>
    entradas.filter(e =>
      e.temBoleto &&
      e.dataVencimentoBoleto &&
      e.status === 'Confirmada' &&
      diasParaVencer(e.dataVencimentoBoleto) <= 3
    ),
    [entradas]
  )

  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Reactive fetch: fires on mount and whenever carregar ref changes (dates updated)
  useEffect(() => { carregar() }, [carregar])

  const filtrados = useMemo(() => {
    let result = entradas
    if (busca) {
      const termo = busca.toLowerCase()
      result = result.filter(e =>
        e.fornecedorNome.toLowerCase().includes(termo) ||
        (e.numeroNotaFiscal ?? '').toLowerCase().includes(termo)
      )
    }
    if (status) {
      result = result.filter(e => e.status === status)
    }
    return result
  }, [entradas, busca, status])

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Entradas de Mercadoria"
        breadcrumb={['Movimentações', 'Entradas']}
        subtitulo={loading ? 'Carregando…' : `${entradas.length} entrada${entradas.length !== 1 ? 's' : ''} no período`}
        actions={podeCriar ? (
          <button onClick={() => navigate('/entradas/nova')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Entrada
          </button>
        ) : undefined}
      />

      {boletosVencendo.length > 0 && !bannerDismissed && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, padding: '12px 16px', borderRadius: 12, marginBottom: 4,
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.28)',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                {boletosVencendo.length === 1
                  ? '1 boleto vence em até 3 dias'
                  : `${boletosVencendo.length} boletos vencem em até 3 dias`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>
                {boletosVencendo.map(e => e.fornecedorNome).join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ada-muted)', flexShrink: 0 }}
            aria-label="Fechar alerta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <FiltrosEntradas
        busca={busca}
        onBuscaChange={setBusca}
        de={de}
        onDeChange={atualizarDe}
        ate={ate}
        onAteChange={atualizarAte}
        status={status}
        onStatusChange={setStatus}
      />

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={8} linhas={5} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {entradas.length === 0 ? (
            <EmptyState
              icon={<ArchiveBoxIcon className="w-7 h-7" />}
              iconColor="green"
              titulo="Nenhuma entrada no período"
              descricao="Ajuste o período ou registre uma nova entrada."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Fornecedor</th>
                    <th className="table-th" scope="col">Nota Fiscal</th>
                    <th className="table-th" scope="col">Data</th>
                    <th className="table-th" scope="col">Recebido por</th>
                    <th className="table-th" scope="col">Itens</th>
                    <th className="table-th table-th-right" scope="col">Custo Total</th>
                    <th className="table-th" scope="col">Venc. Boleto</th>
                    <th className="table-th" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-td text-center py-10 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        Nenhum resultado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : filtrados.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/entradas/${e.id}`)}
                      className="table-row table-row-clickable"
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {e.fornecedorNome}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="text-[12.5px] font-mono tracking-wide" style={{ color: e.numeroNotaFiscal ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                          {e.numeroNotaFiscal ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                          {formatarData(e.dataEntrada)}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: e.recebidoPor ? 'var(--ada-body)' : 'var(--ada-placeholder)' }}>
                          {e.recebidoPor ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {e.totalItens}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                          {formatarMoeda(e.custoTotal)}
                        </span>
                      </td>
                      <td className="table-td">
                        <BadgeBoleto dataVencimento={e.temBoleto ? e.dataVencimentoBoleto : null} />
                      </td>
                      <td className="table-td">
                        <BadgeStatus status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
