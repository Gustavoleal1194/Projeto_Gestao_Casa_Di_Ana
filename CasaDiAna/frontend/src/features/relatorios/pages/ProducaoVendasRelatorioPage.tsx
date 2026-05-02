import { useEffect, useState, useCallback } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { gerarPdfProducaoVendas } from '@/lib/pdf'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
import type { RelatorioProducaoVendas, RelatorioProducaoVendasItem, ProdutoResumo } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(v: number | null): string {
  if (v == null) return '—'
  return `${v.toFixed(1)}%`
}

export function ProducaoVendasRelatorioPage() {
  const [relatorio, setRelatorio] = useState<RelatorioProducaoVendas | null>(null)
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [produtoFiltro, setProdutoFiltro] = useState('')

  const carregar = useCallback(async (filtroDe: string, filtroAte: string, produtoId?: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.producaoVendas(filtroDe, filtroAte, produtoId || undefined)
      setRelatorio(data)
    } catch {
      setErro('Erro ao carregar relatório.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar(primeiroDoMes(), hoje())
  }, [carregar])

  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate, produtoFiltro || undefined)
  }

  const totais = relatorio?.itens.reduce(
    (acc, item) => ({
      produzido: acc.produzido + item.totalProduzido,
      vendido: acc.vendido + item.totalVendido,
      perda: acc.perda + item.perda,
      custoProducao: acc.custoProducao + item.custoTotalProducao,
      custoPerda: acc.custoPerda + item.custoPerda,
      receita: acc.receita + item.receitaEstimada,
    }),
    { produzido: 0, vendido: 0, perda: 0, custoProducao: 0, custoPerda: 0, receita: 0 }
  )

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Relatório Produção / Vendas"
        breadcrumb={['Relatórios', 'Produção / Vendas']}
        subtitulo="Análise de produção, vendas, perdas e margens"
        actions={relatorio && relatorio.itens.length > 0 ? (
          <button onClick={() => gerarPdfProducaoVendas(relatorio!.itens, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar relatório">
        <FiltroPeriodo de={de} onChangeDe={setDe} ate={ate} onChangeAte={setAte} />
        <div>
          <label className="filter-label">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className="filter-input">
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <FilterBarActions
          loading={loading}
          chips={[
            ...gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte('')),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>

      {loading && <LoadingState mensagem="Carregando relatório…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && relatorio && (
        <>
          {totais && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: 'Total Produzido', value: totais.produzido.toFixed(0), color: 'var(--ada-heading)', highlight: false },
                { label: 'Total Vendido', value: totais.vendido.toFixed(0), color: 'var(--ada-success-text)', highlight: false },
                { label: 'Perda Total', value: totais.perda.toFixed(0), color: totais.perda > 0 ? 'var(--ada-error-text)' : 'var(--ada-heading)', highlight: totais.perda > 0 },
                { label: 'Custo Produção', value: brl(totais.custoProducao), color: 'var(--ada-heading)', highlight: false },
                { label: 'Custo da Perda', value: brl(totais.custoPerda), color: totais.custoPerda > 0 ? 'var(--ada-error-text)' : 'var(--ada-heading)', highlight: totais.custoPerda > 0 },
                { label: 'Receita Estimada', value: brl(totais.receita), color: 'var(--ada-success-text)', highlight: false },
              ].map(card => (
                <div
                  key={card.label}
                  className="ada-surface-card p-4"
                  style={card.highlight ? { background: 'var(--ada-error-bg)', borderColor: 'var(--ada-error-border)' } : {}}
                >
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.10em] mb-1"
                    style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
                  >
                    {card.label}
                  </p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {relatorio.itens.length === 0 ? (
            <div className="state-loading">
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhum produto com produção ou venda no período
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>Ajuste os filtros e tente novamente.</p>
            </div>
          ) : (
            <div className="ada-surface-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]" role="table">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th" scope="col">Produto</th>
                      <th className="table-th table-th-right" scope="col">Preço Venda</th>
                      <th className="table-th table-th-right" scope="col">Produzido</th>
                      <th className="table-th table-th-right" scope="col">Vendido</th>
                      <th className="table-th table-th-right" scope="col">Perda</th>
                      <th className="table-th table-th-right" scope="col">Custo Prod.</th>
                      <th className="table-th table-th-right" scope="col">Custo Médio</th>
                      <th className="table-th table-th-right" scope="col">Receita Est.</th>
                      <th className="table-th table-th-right" scope="col">Mg. Lucro</th>
                      <th className="table-th table-th-right" scope="col">Mg. Perda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.itens.map((item: RelatorioProducaoVendasItem) => (
                      <tr
                        key={item.produtoId}
                        className="table-row"
                        style={item.margemPerda != null && item.margemPerda > 20
                          ? { background: 'var(--ada-error-bg)' }
                          : {}}
                      >
                        <td className="table-td">
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.produtoNome}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{brl(item.precoVenda)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-heading)' }}>{item.totalProduzido.toFixed(0)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-heading)' }}>{item.totalVendido.toFixed(0)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: item.perda > 0 ? 'var(--ada-error-text)' : 'var(--ada-body)' }}
                          >
                            {item.perda.toFixed(0)}
                          </span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{brl(item.custoTotalProducao)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{brl(item.custoMedioUnitario)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-success-text)' }}>{brl(item.receitaEstimada)}</span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span
                            className="text-sm font-semibold"
                            style={{
                              color: item.margemLucro == null ? 'var(--ada-placeholder)'
                                : item.margemLucro >= 30 ? 'var(--ada-success-text)'
                                : item.margemLucro >= 0 ? '#C4870A'
                                : 'var(--ada-error-text)'
                            }}
                          >
                            {pct(item.margemLucro)}
                          </span>
                        </td>
                        <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                          <span
                            className="text-sm font-semibold"
                            style={{
                              color: item.margemPerda == null ? 'var(--ada-placeholder)'
                                : item.margemPerda > 20 ? 'var(--ada-error-text)'
                                : item.margemPerda > 0 ? '#C4870A'
                                : 'var(--ada-body)'
                            }}
                          >
                            {pct(item.margemPerda)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
