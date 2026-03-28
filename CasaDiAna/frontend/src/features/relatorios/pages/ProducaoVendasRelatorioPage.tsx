import { useEffect, useState, useCallback } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { gerarPdfProducaoVendas } from '@/lib/pdf'
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

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

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

  const handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Relatório Produção / Vendas</h1>
        {relatorio && relatorio.itens.length > 0 && (
          <button
            onClick={() => gerarPdfProducaoVendas(relatorio.itens, de, ate)}
            className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Baixar PDF
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Produto</label>
          <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button
          onClick={handleFiltrar}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
        >
          Filtrar
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando relatório...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && relatorio && (
        <>
          {totais && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Total Produzido</p>
                <p className="text-xl font-semibold text-stone-800">{totais.produzido.toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Total Vendido</p>
                <p className="text-xl font-semibold text-stone-800">{totais.vendido.toFixed(0)}</p>
              </div>
              <div className={`rounded-xl shadow-sm border p-4 ${totais.perda > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                <p className="text-xs text-stone-500 mb-1">Perda Total</p>
                <p className={`text-xl font-semibold ${totais.perda > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                  {totais.perda.toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Custo Produção</p>
                <p className="text-lg font-semibold text-stone-800">{brl(totais.custoProducao)}</p>
              </div>
              <div className={`rounded-xl shadow-sm border p-4 ${totais.custoPerda > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                <p className="text-xs text-stone-500 mb-1">Custo da Perda</p>
                <p className={`text-lg font-semibold ${totais.custoPerda > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                  {brl(totais.custoPerda)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
                <p className="text-xs text-stone-500 mb-1">Receita Estimada</p>
                <p className="text-lg font-semibold text-green-700">{brl(totais.receita)}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {relatorio.itens.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-stone-500 text-sm">Nenhum produto com produção ou venda no período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Produto</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Preço Venda</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Produzido</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Vendido</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Perda</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Prod.</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Custo Médio</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Receita Est.</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Margem Lucro</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Margem Perda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.itens.map((item: RelatorioProducaoVendasItem) => (
                      <tr
                        key={item.produtoId}
                        className={`border-b border-stone-100 transition-colors ${
                          item.margemPerda != null && item.margemPerda > 20
                            ? 'bg-red-50 hover:bg-red-100'
                            : 'hover:bg-amber-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-stone-800">{item.produtoNome}</td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.precoVenda)}</td>
                        <td className="px-4 py-3 text-sm text-stone-800 text-right">{item.totalProduzido.toFixed(0)}</td>
                        <td className="px-4 py-3 text-sm text-stone-800 text-right">{item.totalVendido.toFixed(0)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.perda > 0 ? 'text-red-600 font-semibold' : 'text-stone-600'}>
                            {item.perda.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.custoTotalProducao)}</td>
                        <td className="px-4 py-3 text-sm text-stone-600 text-right">{brl(item.custoMedioUnitario)}</td>
                        <td className="px-4 py-3 text-sm text-green-700 font-semibold text-right">{brl(item.receitaEstimada)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            item.margemLucro == null ? 'text-stone-400'
                            : item.margemLucro >= 30 ? 'text-green-600 font-semibold'
                            : item.margemLucro >= 0 ? 'text-amber-600'
                            : 'text-red-600 font-semibold'
                          }>
                            {pct(item.margemLucro)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={
                            item.margemPerda == null ? 'text-stone-400'
                            : item.margemPerda > 20 ? 'text-red-600 font-semibold'
                            : item.margemPerda > 0 ? 'text-amber-600'
                            : 'text-stone-600'
                          }>
                            {pct(item.margemPerda)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
