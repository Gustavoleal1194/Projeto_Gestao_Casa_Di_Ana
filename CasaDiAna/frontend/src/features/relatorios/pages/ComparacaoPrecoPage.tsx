import { useState } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ComparacaoPreco, ComparacaoPrecoIngrediente } from '@/types/estoque'

// ─── Helpers ────────────────────────────────────────────────────────────────
function hoje(): string { return new Date().toISOString().split('T')[0] }
function primeiroDiaMes(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}
function fmtPct(v: number | null) {
  if (v === null) return '—'
  const sinal = v > 0 ? '+' : ''
  return `${sinal}${v.toFixed(2).replace('.', ',')}%`
}

// ─── Badge de tendência ───────────────────────────────────────────────────────
function TendenciaBadge({ tendencia }: { tendencia: ComparacaoPrecoIngrediente['tendenciaPreco'] }) {
  if (tendencia === 'aumento') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-error-bg)', color: 'var(--ada-error-text)', border: '1px solid var(--ada-error-border)' }}>
      <ArrowTrendingUpIcon className="h-3 w-3" />
      Aumento
    </span>
  )
  if (tendencia === 'reducao') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)', border: '1px solid var(--ada-success-border)' }}>
      <ArrowTrendingDownIcon className="h-3 w-3" />
      Redução
    </span>
  )
  if (tendencia === 'estavel') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'var(--ada-surface)', color: 'var(--ada-muted)', border: '1px solid var(--ada-border)' }}>
      <MinusIcon className="h-3 w-3" />
      Estável
    </span>
  )
  return (
    <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>Sem histórico</span>
  )
}

// ─── Linha expandível ─────────────────────────────────────────────────────────
function LinhaIngrediente({ item }: { item: ComparacaoPrecoIngrediente }) {
  const [aberto, setAberto] = useState(false)
  const variacaoColor = item.variacaoValor === null
    ? 'var(--ada-muted)'
    : item.variacaoValor > 0
      ? 'var(--ada-error-text)'
      : item.variacaoValor < 0
        ? 'var(--ada-success-text)'
        : 'var(--ada-muted)'
  const menorPrecoGlobal = item.porFornecedor.reduce(
    (min, f) => f.precoMinimo < min ? f.precoMinimo : min,
    Infinity
  )

  return (
    <>
      <tr
        className="table-row table-row-clickable select-none"
        onClick={() => setAberto(a => !a)}
        aria-expanded={aberto}
      >
        <td className="table-td">
          <div className="flex items-center gap-2">
            {aberto
              ? <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ada-muted)' }} />
              : <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ada-muted)' }} />
            }
            <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              {item.ingredienteNome}
            </span>
            <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>
              ({item.unidadeMedidaCodigo})
            </span>
          </div>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
            {item.precoAnterior !== null ? fmtMoeda(item.precoAnterior) : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            {item.ultimoPreco !== null ? fmtMoeda(item.ultimoPreco) : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm font-semibold" style={{ color: variacaoColor }}>
            {item.variacaoValor !== null ? fmtMoeda(item.variacaoValor) : '—'}
          </span>
          {item.variacaoPercentual !== null && (
            <span className="text-xs ml-1" style={{ color: variacaoColor }}>
              ({fmtPct(item.variacaoPercentual)})
            </span>
          )}
        </td>
        <td className="table-td">
          <TendenciaBadge tendencia={item.tendenciaPreco} />
        </td>
        <td className="table-td">
          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
            {item.porFornecedor.length > 0
              ? item.porFornecedor[0].fornecedorNome
              : '—'}
          </span>
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
          <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>
            {item.historico.length}
          </span>
        </td>
      </tr>

      {aberto && (
        <tr>
          <td colSpan={7} className="p-0">
            <div
              className="px-6 py-4 space-y-5"
              style={{ background: 'var(--ada-surface)', borderBottom: '1px solid var(--ada-border)' }}
            >
              {/* Histórico de preços */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                  Histórico de compras
                </p>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-head-row">
                        <th className="table-th" scope="col">Data</th>
                        <th className="table-th" scope="col">Fornecedor</th>
                        <th className="table-th" scope="col">NF</th>
                        <th className="table-th table-th-right" scope="col">Qtd.</th>
                        <th className="table-th table-th-right" scope="col">Custo Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...item.historico].reverse().map((h, idx) => (
                        <tr key={`${h.entradaId}-${idx}`} className="table-row">
                          <td className="table-td tabular-nums">
                            <span style={{ color: 'var(--ada-body)' }}>{fmtData(h.dataEntrada)}</span>
                          </td>
                          <td className="table-td">
                            <span style={{ color: 'var(--ada-body)' }}>{h.fornecedorNome}</span>
                          </td>
                          <td className="table-td font-mono">
                            <span style={{ color: 'var(--ada-muted)' }}>{h.numeroNotaFiscal ?? '—'}</span>
                          </td>
                          <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--ada-body)' }}>{h.quantidade}</span>
                          </td>
                          <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--ada-heading)' }}>{fmtMoeda(h.custoUnitario)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparação por fornecedor */}
              {item.porFornecedor.length > 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                    Comparação por fornecedor
                  </p>
                  <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ada-border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-head-row">
                          <th className="table-th" scope="col">Fornecedor</th>
                          <th className="table-th table-th-right" scope="col">Menor preço</th>
                          <th className="table-th table-th-right" scope="col">Maior preço</th>
                          <th className="table-th table-th-right" scope="col">Preço médio</th>
                          <th className="table-th table-th-right" scope="col">Último preço</th>
                          <th className="table-th" scope="col">Última compra</th>
                          <th className="table-th table-th-right" scope="col">Compras</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.porFornecedor.map(f => {
                          const isMelhor = f.precoMinimo === menorPrecoGlobal
                          return (
                            <tr key={f.fornecedorId} className="table-row">
                              <td className="table-td">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold" style={{ color: 'var(--ada-heading)' }}>
                                    {f.fornecedorNome}
                                  </span>
                                  {isMelhor && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                      style={{ background: 'var(--ada-success-bg)', color: 'var(--ada-success-text)' }}>
                                      melhor preço
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-success-text)' }}>
                                {fmtMoeda(f.precoMinimo)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-error-text)' }}>
                                {fmtMoeda(f.precoMaximo)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-body)' }}>
                                {fmtMoeda(f.precoMedio)}
                              </td>
                              <td className="table-td tabular-nums font-semibold" style={{ textAlign: 'right', color: 'var(--ada-heading)' }}>
                                {fmtMoeda(f.ultimoPreco)}
                              </td>
                              <td className="table-td" style={{ color: 'var(--ada-body)' }}>
                                {fmtData(f.ultimaCompra)}
                              </td>
                              <td className="table-td tabular-nums" style={{ textAlign: 'right', color: 'var(--ada-muted)' }}>
                                {f.totalCompras}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Mini-tabela de destaques ─────────────────────────────────────────────────
function TabelaDestaque({
  titulo,
  itens,
  tipo,
}: {
  titulo: string
  itens: ComparacaoPrecoIngrediente[]
  tipo: 'aumento' | 'reducao'
}) {
  if (itens.length === 0) return null
  const cor = tipo === 'aumento' ? 'var(--ada-error-text)' : 'var(--ada-success-text)'
  return (
    <div className="ada-surface-card p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-3"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
        {titulo}
      </p>
      <div className="space-y-2">
        {itens.map(item => (
          <div key={item.ingredienteId} className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ada-body)' }}>
              {item.ingredienteNome}
              <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>
                ({item.unidadeMedidaCodigo})
              </span>
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: cor }}>
              {fmtPct(item.variacaoPercentual)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ComparacaoPrecoPage() {
  const [dados, setDados] = useState<ComparacaoPreco | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDiaMes)
  const [ate, setAte] = useState(hoje)

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.comparacaoPrecos(de || undefined, ate || undefined)
      setDados(data)
    } catch {
      setErro('Erro ao carregar comparação de preços.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  const temDestaques = dados &&
    (dados.maioresAumentos.length > 0 || dados.maioresReducoes.length > 0)

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Comparação de Preços"
        breadcrumb={['Relatórios', 'Comparação de Preços']}
        subtitulo="Variação de preços de ingredientes entre entradas e fornecedores"
      />

      <form onSubmit={handleFiltrar} className="filter-bar" role="search" aria-label="Filtrar comparação">
        <div>
          <label className="filter-label">De</label>
          <input
            type="date"
            value={de}
            onChange={e => setDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label className="filter-label">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => setAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <button type="submit" className="btn-secondary" disabled={loading}>
          {loading ? 'Carregando…' : 'Gerar Comparação'}
        </button>
        {(de || ate) && (
          <button
            type="button"
            className="btn-ghost text-sm"
            style={{ color: 'var(--ada-muted)' }}
            onClick={() => { setDe(''); setAte(''); }}
          >
            Ver todo o histórico
          </button>
        )}
      </form>

      {loading && <SkeletonTable colunas={7} linhas={6} />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}

      {!loading && dados && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Ingredientes comparados
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                {dados.ingredientes.length}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Com aumento de preço
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-error-text)' }}>
                {dados.ingredientes.filter(i => i.tendenciaPreco === 'aumento').length}
              </p>
            </div>
            <div className="ada-surface-card p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Com redução de preço
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ada-success-text)' }}>
                {dados.ingredientes.filter(i => i.tendenciaPreco === 'reducao').length}
              </p>
            </div>
          </div>

          {/* Destaques */}
          {temDestaques && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <TabelaDestaque
                titulo="Maiores aumentos"
                itens={dados.maioresAumentos}
                tipo="aumento"
              />
              <TabelaDestaque
                titulo="Maiores reduções"
                itens={dados.maioresReducoes}
                tipo="reducao"
              />
            </div>
          )}

          {/* Tabela principal */}
          {dados.ingredientes.length === 0 ? (
            <EmptyState
              icon={<ScaleIcon className="w-7 h-7" />}
              titulo="Nenhum ingrediente encontrado"
              descricao="Não há entradas de mercadoria confirmadas no período selecionado."
            />
          ) : (
            <div className="ada-surface-card">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th" scope="col">Ingrediente</th>
                      <th className="table-th table-th-right" scope="col">Preço anterior</th>
                      <th className="table-th table-th-right" scope="col">Último preço</th>
                      <th className="table-th table-th-right" scope="col">Variação</th>
                      <th className="table-th" scope="col">Tendência</th>
                      <th className="table-th" scope="col">Último fornecedor</th>
                      <th className="table-th table-th-right" scope="col">Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.ingredientes.map(item => (
                      <LinhaIngrediente key={item.ingredienteId} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2 text-xs" style={{ color: 'var(--ada-placeholder)' }}>
                Clique em um ingrediente para ver o histórico completo e comparação por fornecedor.
              </p>
            </div>
          )}
        </>
      )}

      {!loading && !dados && !erro && (
        <EmptyState
          icon={<ScaleIcon className="w-7 h-7" />}
          titulo="Selecione um período"
          descricao='Defina o intervalo de datas e clique em "Gerar Comparação" para visualizar.'
        />
      )}
    </div>
  )
}
