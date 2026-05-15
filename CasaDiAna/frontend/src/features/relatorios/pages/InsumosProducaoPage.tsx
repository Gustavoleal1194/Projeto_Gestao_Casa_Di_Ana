import { useEffect, useState, useCallback } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { gerarPdfInsumosProducao } from '@/lib/pdf'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { FiltrosRelatorio } from '../components/FiltrosRelatorio'
import { EntityChipDropdown } from '../components/EntityChipDropdown'
import type { InsumoProducaoDia, IngredienteResumo } from '@/types/estoque'
import type { ProdutoResumo } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function InsumosProducaoPage() {
  const [itens, setItens] = useState<InsumoProducaoDia[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [ingredienteFiltros, setIngredienteFiltros] = useState<string[]>([])
  const [produtoFiltros, setProdutoFiltros] = useState<string[]>([])

  const carregar = useCallback(async (
    filtroDe: string,
    filtroAte: string,
    ingredienteIds?: string[],
    produtoIds?: string[],
  ) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.insumosProducao(
        filtroDe, filtroAte,
        ingredienteIds && ingredienteIds.length > 0 ? ingredienteIds : undefined,
        produtoIds && produtoIds.length > 0 ? produtoIds : undefined
      )
      setItens(data)
    } catch {
      setErro('Erro ao carregar relatório.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ingredientesService.listar().then(setIngredientes).catch(() => {})
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar(primeiroDoMes(), hoje())
  }, [carregar])

  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(
      de, ate,
      ingredienteFiltros.length > 0 ? ingredienteFiltros : undefined,
      produtoFiltros.length > 0 ? produtoFiltros : undefined
    )
  }

  // Agrupar por data para exibição
  const porData = itens.reduce<Record<string, InsumoProducaoDia[]>>((acc, item) => {
    if (!acc[item.data]) acc[item.data] = []
    acc[item.data].push(item)
    return acc
  }, {})

  const datas = Object.keys(porData).sort()

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Insumos por Produção"
        breadcrumb={['Relatórios', 'Insumos por Produção']}
        subtitulo="Consumo de ingredientes por dia e por produto produzido"
        actions={itens.length > 0 ? (
          <button onClick={() => gerarPdfInsumosProducao(itens, de, ate)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FiltrosRelatorio
        de={de} onDeChange={setDe} ate={ate} onAteChange={setAte}
        onSubmit={handleFiltrar} loading={loading}
        pills={[
          ...(de ? [{ tag: 'De', valor: de.split('-').reverse().join('/'), onRemove: () => setDe('') }] : []),
          ...(ate ? [{ tag: 'Até', valor: ate.split('-').reverse().join('/'), onRemove: () => setAte('') }] : []),
          ...(ingredienteFiltros.map(id => ({
            tag: 'Ingrediente',
            valor: ingredientes.find(i => i.id === id)?.nome ?? id,
            onRemove: () => setIngredienteFiltros(prev => prev.filter(x => x !== id)),
          }))),
          ...(produtoFiltros.map(id => ({
            tag: 'Produto',
            valor: produtos.find(p => p.id === id)?.nome ?? id,
            onRemove: () => setProdutoFiltros(prev => prev.filter(x => x !== id)),
          }))),
        ]}
      >
        <EntityChipDropdown
          label="Ingrediente"
          valores={ingredienteFiltros}
          opcoes={[{ valor: '', rotulo: 'Todos' }, ...ingredientes.map(i => ({ valor: i.id, rotulo: i.nome }))]}
          onChange={setIngredienteFiltros}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 2l1.5 1.5L6 2l1.5 1.5L9 2l1.5 1.5L12 2v10l-1.5-.75L9 12l-1.5-.75L6 12l-1.5-.75L3 12V2z" />
              <path d="M3 12v8a1 1 0 001 1h8a1 1 0 001-1v-8" />
            </svg>
          }
        />
        <EntityChipDropdown
          label="Produto"
          valores={produtoFiltros}
          opcoes={[{ valor: '', rotulo: 'Todos' }, ...produtos.map(p => ({ valor: p.id, rotulo: p.nome }))]}
          onChange={setProdutoFiltros}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          }
        />
      </FiltrosRelatorio>

      {loading && <LoadingState mensagem="Carregando insumos…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && itens.length === 0 && (
        <div className="state-loading">
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhum registro de produção no período
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>Ajuste os filtros e tente novamente.</p>
        </div>
      )}
      {!loading && !erro && datas.length > 0 && (
        <div className="space-y-4">
          {datas.map(data => {
            const linhas = porData[data]
            const totalDia = linhas.reduce((a, l) => a + l.quantidade, 0)
            const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
            })

            return (
              <div key={data} className="ada-surface-card">
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border)' }}
                >
                  <span
                    className="text-sm font-semibold capitalize"
                    style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
                  >
                    {dataFormatada}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                    {linhas.length} lançamento(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" role="table">
                    <thead>
                      <tr className="table-head-row">
                        <th className="table-th" scope="col">Produto</th>
                        <th className="table-th" scope="col">Ingrediente</th>
                        <th className="table-th table-th-right" scope="col">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((linha, idx) => (
                        <tr
                          key={`${linha.producaoDiariaId}-${linha.ingredienteId}-${idx}`}
                          className="table-row"
                        >
                          <td className="table-td">
                            <div className="flex items-center gap-2.5">
                              <span className="accent-bar shrink-0" aria-hidden="true" />
                              <span className="text-sm" style={{ color: 'var(--ada-body)' }}>{linha.produtoNome}</span>
                            </div>
                          </td>
                          <td className="table-td">
                            <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>{linha.ingredienteNome}</span>
                          </td>
                          <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                            <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                              {linha.quantidade.toFixed(3)}
                            </span>
                            <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>
                              {linha.unidadeMedidaCodigo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--ada-warning-badge)', borderTop: '1px solid var(--ada-warning-border)' }}>
                        <td
                          colSpan={2}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: 'var(--ada-muted)' }}
                        >
                          Total do dia
                        </td>
                        <td
                          className="px-4 py-2 text-sm font-bold tabular-nums"
                          style={{ textAlign: 'right', color: '#C4870A' }}
                        >
                          {totalDia.toFixed(3)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
