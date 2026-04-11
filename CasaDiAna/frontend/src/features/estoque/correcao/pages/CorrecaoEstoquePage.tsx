import { useEffect, useState } from 'react'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erros?: string[] } } })?.response?.data?.erros?.[0] ?? 'Erro ao salvar correções.'
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
    <div className="ada-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Correção de Estoque
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ada-muted)' }}>
            Informe a quantidade real de cada ingrediente. Só os campos preenchidos serão atualizados.
          </p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando || alteradas.length === 0}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando…' : `Salvar${alteradas.length > 0 ? ` (${alteradas.length})` : ''}`}
        </button>
      </div>

      {/* Barra de busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar ingrediente ou categoria..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full max-w-sm rounded-lg px-3 py-2 text-sm outline-none transition-all
                     focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
          style={{
            border: '1px solid var(--ada-border)',
            background: 'var(--ada-surface)',
            color: 'var(--ada-heading)',
            boxShadow: 'var(--shadow-xs)',
          }}
        />
      </div>

      {alteradas.length > 0 && (
        <div
          className="mb-4 rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: 'var(--ada-warning-bg)',
            border: '1px solid var(--ada-warning-border)',
            color: 'var(--ada-warning-text)',
          }}
        >
          {alteradas.length} ingrediente(s) com alteração pendente. Clique em "Salvar" para confirmar.
        </div>
      )}

      {loading && <LoadingState mensagem="Carregando ingredientes…" />}

      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}

      {!loading && !erro && (
        <div className="ada-surface-card">
          {linhasFiltradas.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Nenhum ingrediente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Ingrediente</th>
                    <th className="table-th" scope="col">Categoria</th>
                    <th className="table-th table-th-right" scope="col">Estoque Atual</th>
                    <th className="table-th w-36" scope="col">Nova Quantidade</th>
                    <th className="table-th" scope="col">Observação</th>
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
                        style={{
                          borderBottom: '1px solid var(--ada-border-sub)',
                          background: alterada ? 'var(--ada-warning-bg)' : undefined,
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => { if (!alterada) (e.currentTarget as HTMLElement).style.background = 'var(--ada-hover)' }}
                        onMouseLeave={e => { if (!alterada) (e.currentTarget as HTMLElement).style.background = '' }}
                      >
                        <td className="px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
                          {linha.nome}
                        </td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ada-muted)' }}>
                          {linha.categoriaNome ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right">
                          <span className="font-semibold" style={{ color: 'var(--ada-body)' }}>
                            {linha.estoqueAtual} {linha.unidadeMedidaCodigo}
                          </span>
                          {diff !== null && (
                            <span className={`ml-2 text-xs font-medium ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ({diff > 0 ? '+' : ''}{diff.toFixed(3)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder={String(linha.estoqueAtual)}
                              value={linha.novaQuantidade}
                              onChange={e => handleQuantidade(linha.ingredienteId, e.target.value)}
                              className="w-28 rounded-lg px-2.5 py-1.5 text-sm text-right outline-none transition-all
                                         focus:ring-2 focus:ring-[#C4870A]/25"
                              style={{
                                border: alterada ? '1px solid #C4870A' : '1px solid var(--ada-border)',
                                background: alterada ? 'var(--ada-warning-bg)' : 'var(--ada-surface)',
                                color: 'var(--ada-heading)',
                                boxShadow: 'var(--shadow-xs)',
                              }}
                            />
                            <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                              {linha.unidadeMedidaCodigo}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            placeholder="Motivo (opcional)"
                            value={linha.observacao}
                            onChange={e => handleObservacao(linha.ingredienteId, e.target.value)}
                            disabled={!alterada}
                            className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none transition-all
                                       focus:ring-2 focus:ring-[#C4870A]/25"
                            style={{
                              border: '1px solid var(--ada-border)',
                              background: alterada ? 'var(--ada-surface)' : 'var(--ada-surface-2)',
                              color: alterada ? 'var(--ada-heading)' : 'var(--ada-muted)',
                              cursor: alterada ? 'text' : 'not-allowed',
                              boxShadow: 'var(--shadow-xs)',
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
