import { useEffect, useState, useCallback } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { gerarPdfInsumosProducao } from '@/lib/pdf'
import type { InsumoProducaoDia, IngredienteResumo } from '@/types/estoque'
import type { ProdutoResumo } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

const inputClass =
  'border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function InsumosProducaoPage() {
  const [itens, setItens] = useState<InsumoProducaoDia[]>([])
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [ingredienteFiltro, setIngredienteFiltro] = useState('')
  const [produtoFiltro, setProdutoFiltro] = useState('')

  const carregar = useCallback(async (
    filtroDe: string,
    filtroAte: string,
    ingredienteId?: string,
    produtoId?: string,
  ) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.insumosProducao(
        filtroDe, filtroAte, ingredienteId || undefined, produtoId || undefined
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

  const handleFiltrar = () =>
    carregar(de, ate, ingredienteFiltro || undefined, produtoFiltro || undefined)

  // Agrupar por data para exibição
  const porData = itens.reduce<Record<string, InsumoProducaoDia[]>>((acc, item) => {
    if (!acc[item.data]) acc[item.data] = []
    acc[item.data].push(item)
    return acc
  }, {})

  const datas = Object.keys(porData).sort()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Insumos por Produção</h1>
          <p className="text-sm text-stone-500 mt-1">
            Consumo de ingredientes por dia e por produto produzido.
          </p>
        </div>
        {itens.length > 0 && (
          <button
            onClick={() => gerarPdfInsumosProducao(itens, de, ate)}
            className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Baixar PDF
          </button>
        )}
      </div>

      {/* Filtros */}
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
          <label className="block text-xs font-medium text-stone-500 mb-1">Ingrediente</label>
          <select value={ingredienteFiltro} onChange={e => setIngredienteFiltro(e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {ingredientes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
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
          <p className="text-stone-500 mt-3 text-sm">Carregando...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && itens.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <p className="text-stone-500 text-sm">Nenhum registro de produção no período.</p>
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
              <div key={data} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-700 capitalize">{dataFormatada}</span>
                  <span className="text-xs text-stone-500">{linhas.length} lançamento(s)</span>
                </div>
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-2.5 text-left">Produto</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-2.5 text-left">Ingrediente</th>
                      <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-2.5 text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha, idx) => (
                      <tr key={`${linha.producaoDiariaId}-${linha.ingredienteId}-${idx}`}
                          className="border-b border-stone-100 hover:bg-amber-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-stone-700">{linha.produtoNome}</td>
                        <td className="px-4 py-2.5 text-sm text-stone-600">{linha.ingredienteNome}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium text-stone-800">
                          {linha.quantidade.toFixed(3)} <span className="text-xs text-stone-400 font-normal">{linha.unidadeMedidaCodigo}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 border-t border-amber-200">
                      <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                        Total do dia
                      </td>
                      <td className="px-4 py-2 text-sm font-bold text-amber-800 text-right">
                        {totalDia.toFixed(3)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
