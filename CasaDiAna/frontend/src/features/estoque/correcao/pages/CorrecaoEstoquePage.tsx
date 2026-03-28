import { useEffect, useState } from 'react'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { IngredienteResumo } from '@/types/estoque'

interface LinhaCorrecao {
  ingredienteId: string
  nome: string
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  novaQuantidade: string   // string para o input
  observacao: string
}

export function CorrecaoEstoquePage() {
  const [linhas, setLinhas] = useState<LinhaCorrecao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await ingredientesService.listar()
      setLinhas(data.map((i: IngredienteResumo) => ({
        ingredienteId: i.id,
        nome: i.nome,
        categoriaNome: i.categoriaNome ?? null,
        unidadeMedidaCodigo: i.unidadeMedidaCodigo,
        estoqueAtual: i.estoqueAtual,
        novaQuantidade: '',
        observacao: '',
      })))
    } catch {
      setErro('Erro ao carregar ingredientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const handleQuantidade = (id: string, valor: string) => {
    setLinhas(prev => prev.map(l =>
      l.ingredienteId === id ? { ...l, novaQuantidade: valor } : l
    ))
  }

  const handleObservacao = (id: string, valor: string) => {
    setLinhas(prev => prev.map(l =>
      l.ingredienteId === id ? { ...l, observacao: valor } : l
    ))
  }

  const alteradas = linhas.filter(l => l.novaQuantidade !== '' && l.novaQuantidade !== String(l.estoqueAtual))

  const handleSalvar = async () => {
    if (alteradas.length === 0) return
    setSalvando(true)
    try {
      await api.post<ApiResponse<null>>('/estoque/correcoes', {
        itens: alteradas.map(l => ({
          ingredienteId: l.ingredienteId,
          novaQuantidade: Number(l.novaQuantidade),
          observacao: l.observacao || null,
        })),
      })
      setToast({ tipo: 'sucesso', mensagem: `${alteradas.length} ingrediente(s) corrigido(s) com sucesso.` })
      carregar()
    } catch (err: any) {
      const msg = err?.response?.data?.erros?.[0] ?? 'Erro ao salvar correções.'
      setToast({ tipo: 'erro', mensagem: msg })
    } finally {
      setSalvando(false)
    }
  }

  const linhasFiltradas = linhas.filter(l =>
    busca === '' || l.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (l.categoriaNome ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Correção de Estoque</h1>
          <p className="text-sm text-stone-500 mt-1">
            Informe a quantidade real de cada ingrediente. Só os campos preenchidos serão atualizados.
          </p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando || alteradas.length === 0}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {salvando ? 'Salvando...' : `Salvar${alteradas.length > 0 ? ` (${alteradas.length})` : ''}`}
        </button>
      </div>

      {/* Barra de busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar ingrediente ou categoria..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full max-w-sm border border-stone-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {alteradas.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
          {alteradas.length} ingrediente(s) com alteração pendente. Clique em "Salvar" para confirmar.
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
          <p className="text-stone-500 mt-3 text-sm">Carregando ingredientes...</p>
        </div>
      )}

      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{erro}</div>
      )}

      {!loading && !erro && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {linhasFiltradas.length === 0 ? (
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
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left w-36">Nova Quantidade</th>
                  <th className="text-xs font-medium text-stone-500 uppercase tracking-wide px-4 py-3 text-left">Observação</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map(linha => {
                  const alterada = linha.novaQuantidade !== '' && linha.novaQuantidade !== String(linha.estoqueAtual)
                  const novaNum = Number(linha.novaQuantidade)
                  const diff = alterada ? novaNum - linha.estoqueAtual : null

                  return (
                    <tr
                      key={linha.ingredienteId}
                      className={`border-b border-stone-100 transition-colors ${alterada ? 'bg-amber-50' : 'hover:bg-stone-50'}`}
                    >
                      <td className="px-4 py-2.5 text-sm font-medium text-stone-800">{linha.nome}</td>
                      <td className="px-4 py-2.5 text-sm text-stone-500">{linha.categoriaNome ?? '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        <span className="font-semibold text-stone-700">
                          {linha.estoqueAtual} {linha.unidadeMedidaCodigo}
                        </span>
                        {diff !== null && (
                          <span className={`ml-2 text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({diff > 0 ? '+' : ''}{diff.toFixed(3)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder={String(linha.estoqueAtual)}
                            value={linha.novaQuantidade}
                            onChange={e => handleQuantidade(linha.ingredienteId, e.target.value)}
                            className={`w-28 border rounded-lg px-2.5 py-1.5 text-sm text-right
                                        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                                        ${alterada ? 'border-amber-400 bg-amber-50' : 'border-stone-200 bg-white'}`}
                          />
                          <span className="text-xs text-stone-400">{linha.unidadeMedidaCodigo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          placeholder="Motivo (opcional)"
                          value={linha.observacao}
                          onChange={e => handleObservacao(linha.ingredienteId, e.target.value)}
                          disabled={!alterada}
                          className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                                     disabled:bg-stone-50 disabled:text-stone-400"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
