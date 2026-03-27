import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useEntradas } from '../hooks/useEntradas'
import { useAuthStore } from '@/store/authStore'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function badgeStatus(status: string) {
  if (status === 'Confirmada') return 'bg-green-100 text-green-700'
  if (status === 'Cancelada') return 'bg-red-100 text-red-700'
  return 'bg-stone-100 text-stone-500'
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function EntradasPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { entradas, loading, erro, de, ate, atualizarDe, atualizarAte, carregar } = useEntradas()
  const podeCriar = temPapel(...PAPEIS_EDICAO)

  useEffect(() => { carregar() }, [carregar])

  const handleFiltrar = (e: React.FormEvent) => { e.preventDefault(); carregar() }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Entradas de Mercadoria</h1>
        {podeCriar && (
          <button
            onClick={() => navigate('/entradas/nova')}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Nova Entrada
          </button>
        )}
      </div>

      <form
        onSubmit={handleFiltrar}
        className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">De</label>
          <input
            type="date"
            value={de}
            onChange={e => atualizarDe(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Até</label>
          <input
            type="date"
            value={ate}
            onChange={e => atualizarAte(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium"
        >
          Filtrar
        </button>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando entradas...</p>
        </div>
      )}
      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}
      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {entradas.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-stone-500 text-sm">Nenhuma entrada no período selecionado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Fornecedor</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Nota Fiscal</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Data</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Itens</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Custo Total</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/entradas/${e.id}`)}
                    className="border-b border-stone-100 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{e.fornecedorNome}</td>
                    <td className="px-4 py-3 text-sm text-stone-600 font-mono">{e.numeroNotaFiscal ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{formatarData(e.dataEntrada)}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{e.totalItens}</td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{formatarMoeda(e.custoTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badgeStatus(e.status)}`}>
                        {e.status}
                      </span>
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
