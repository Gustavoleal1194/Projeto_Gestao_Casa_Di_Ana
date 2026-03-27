import { useEffect, useState } from 'react'
import { relatoriosService } from '../services/relatoriosService'
import type { EstoqueAtualItem } from '@/types/estoque'

export function EstoqueAtualPage() {
  const [itens, setItens] = useState<EstoqueAtualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasAbaixo, setApenasAbaixo] = useState(false)

  const carregar = async (filtro: boolean) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.estoqueAtual(filtro)
      setItens(data)
    } catch {
      setErro('Erro ao carregar relatório de estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar(false) }, [])

  const handleToggle = () => {
    const novo = !apenasAbaixo
    setApenasAbaixo(novo)
    carregar(novo)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Estoque Atual</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={apenasAbaixo}
            onChange={handleToggle}
            className="h-4 w-4 accent-amber-700"
          />
          <span className="text-sm text-stone-600">Apenas abaixo do mínimo</span>
        </label>
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
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {itens.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhum ingrediente encontrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Ingrediente</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Categoria</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Estoque Atual</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Mínimo</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-right">Máximo</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Situação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map(item => (
                  <tr key={item.ingredienteId} className={`border-b border-stone-100 ${item.estaBaixoDoMinimo ? 'bg-red-50' : 'hover:bg-amber-50'} transition-colors`}>
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{item.nome}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{item.categoriaNome ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">
                      <span className={item.estaBaixoDoMinimo ? 'text-red-600' : 'text-stone-800'}>
                        {item.estoqueAtual} {item.unidadeMedidaCodigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 text-right">{item.estoqueMinimo} {item.unidadeMedidaCodigo}</td>
                    <td className="px-4 py-3 text-sm text-stone-600 text-right">
                      {item.estoqueMaximo != null ? `${item.estoqueMaximo} ${item.unidadeMedidaCodigo}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.estaBaixoDoMinimo ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Abaixo do mínimo</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
