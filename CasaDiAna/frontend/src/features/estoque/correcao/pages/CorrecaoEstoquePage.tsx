import { useEffect, useState } from 'react'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid'
import { ingredientesService } from '@/features/estoque/ingredientes/services/ingredientesService'
import { Toast } from '@/components/ui/Toast'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { IngredienteResumo } from '@/types/estoque'

interface LinhaCorrecao {
  ingredienteId: string
  nome: string
  categoriaNome: string | null
  unidadeMedidaCodigo: string
  estoqueAtual: number
  novaQuantidade: string
  observacao: string
}

const thCls = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em]'
const tdCls = 'px-5 py-3.5'

export function CorrecaoEstoquePage() {
  const [linhas, setLinhas] = useState<LinhaCorrecao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [busca, setBusca] = useState('')
  const [focadoBusca, setFocadoBusca] = useState(false)

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
      <PageHeader
        titulo="Correção de Estoque"
        breadcrumb={['Estoque', 'Correção de Estoque']}
        subtitulo="Informe a quantidade real de cada ingrediente. Só os campos preenchidos serão atualizados."
        actions={
          <button
            onClick={handleSalvar}
            disabled={salvando || alteradas.length === 0}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando…' : `Salvar${alteradas.length > 0 ? ` (${alteradas.length})` : ''}`}
          </button>
        }
      />

      {/* Barra de busca — premium shell */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--ada-surface) 0%, var(--ada-bg) 100%)',
        border: '1px solid var(--ada-border)', borderRadius: 20,
        boxShadow: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 60px rgba(0,0,0,.40), 0 8px 24px rgba(0,0,0,.28)',
        marginBottom: 24,
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60px at 50% 0%, rgba(212,150,12,.10) 0%, transparent 100%)' }} aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: busca ? '1px solid var(--ada-border-sub)' : 'none', position: 'relative' }}>
          <div onFocus={() => setFocadoBusca(true)} onBlur={() => setFocadoBusca(false)} style={{
            position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 14px', height: 48, background: 'var(--ada-surface-2)',
            border: `1px solid ${focadoBusca ? 'rgba(240,176,48,.45)' : 'var(--ada-border)'}`, borderRadius: 12,
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow: focadoBusca ? '0 0 0 4px rgba(212,150,12,.10), 0 0 24px -4px rgba(240,176,48,.35)' : 'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: focadoBusca ? '#F0B030' : 'var(--ada-muted)', transition: 'color 200ms ease' }} aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <label htmlFor="busca-correcao" className="sr-only">Buscar ingrediente</label>
            <input id="busca-correcao" type="text" placeholder="Buscar ingrediente ou categoria…" value={busca} onChange={e => setBusca(e.target.value)} autoComplete="off" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14.5, fontWeight: 500, color: 'var(--ada-heading)', letterSpacing: '-.005em', height: '100%' }} />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(255,255,255,.06)', color: 'var(--ada-muted)', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
        {busca && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 20px', background: 'linear-gradient(90deg, rgba(212,150,12,.04) 0%, transparent 60%)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: '#F0B030', paddingRight: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0B030', boxShadow: '0 0 6px rgba(240,176,48,.35)', animation: 'dotPulseFilter 2s ease infinite', display: 'inline-block' }} aria-hidden="true" />
              Ativos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(212,150,12,.12)', border: '1px solid rgba(240,176,48,.28)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--ada-heading)', overflow: 'hidden', animation: 'pillIn 250ms cubic-bezier(.34,1.56,.64,1)' }}>
              <span style={{ padding: '5px 9px', fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 500, color: '#F0B030', textTransform: 'uppercase', letterSpacing: '.08em', background: 'rgba(212,150,12,.10)', borderRight: '1px solid rgba(240,176,48,.20)' }}>Busca</span>
              <span style={{ padding: '5px 9px' }}>{busca}</span>
              <button type="button" onClick={() => setBusca('')} aria-label="Remover filtro de busca" style={{ padding: '5px 9px 5px 4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ada-muted)', display: 'flex', alignItems: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </span>
          </div>
        )}
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

      {loading && <SkeletonTable colunas={5} linhas={8} />}

      {!loading && erro && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: 'var(--ada-error-text)' }}
          role="alert"
        >
          {erro}
        </div>
      )}

      {!loading && !erro && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--ada-surface)',
            border: '1px solid var(--ada-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {linhasFiltradas.length === 0 ? (
            <EmptyState
              icon={<AdjustmentsHorizontalIcon className="w-7 h-7" />}
              iconColor="neutral"
              titulo="Nenhum ingrediente encontrado"
              descricao="Ajuste o filtro de busca para localizar o ingrediente desejado."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}>
                    <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Ingrediente</th>
                    <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Categoria</th>
                    <th className={`${thCls} text-right`} style={{ color: 'var(--ada-muted)' }} scope="col">Estoque Atual</th>
                    <th className={`${thCls} w-36`} style={{ color: 'var(--ada-muted)' }} scope="col">Nova Quantidade</th>
                    <th className={thCls} style={{ color: 'var(--ada-muted)' }} scope="col">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((linha, idx) => {
                    const alterada = linha.novaQuantidade !== '' && linha.novaQuantidade !== String(linha.estoqueAtual)
                    const novaNum = Number(linha.novaQuantidade)
                    const diff = alterada ? novaNum - linha.estoqueAtual : null

                    return (
                      <tr
                        key={linha.ingredienteId}
                        className="transition-colors duration-100"
                        style={{
                          borderBottom: idx < linhasFiltradas.length - 1 ? '1px solid var(--ada-hover)' : 'none',
                          background: alterada ? 'var(--ada-warning-bg)' : 'var(--ada-surface)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = alterada ? 'var(--ada-row-alert-hover)' : 'var(--ada-surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = alterada ? 'var(--ada-warning-bg)' : 'var(--ada-surface)')}
                      >
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`accent-bar shrink-0${alterada ? ' accent-bar-alert' : ''}`}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                              {linha.nome}
                            </span>
                          </div>
                        </td>

                        <td className={tdCls}>
                          <span className="text-sm" style={{ color: linha.categoriaNome ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                            {linha.categoriaNome ?? '—'}
                          </span>
                        </td>

                        <td className={`${tdCls} text-right`}>
                          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ada-body)' }}>
                            {linha.estoqueAtual} {linha.unidadeMedidaCodigo}
                          </span>
                          {diff !== null && (
                            <span
                              className="ml-2 text-xs font-medium"
                              style={{ color: diff > 0 ? 'var(--ada-success-text)' : 'var(--ada-danger-text)' }}
                            >
                              ({diff > 0 ? '+' : ''}{diff.toFixed(3)})
                            </span>
                          )}
                        </td>

                        <td className={tdCls}>
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
                                border: alterada ? '1px solid var(--ada-warning-border)' : '1px solid var(--ada-border)',
                                background: alterada ? 'var(--ada-surface-2)' : 'var(--ada-surface-2)',
                                color: 'var(--ada-heading)',
                                boxShadow: 'var(--shadow-xs)',
                              }}
                            />
                            <span className="text-xs" style={{ color: 'var(--ada-muted)' }}>
                              {linha.unidadeMedidaCodigo}
                            </span>
                          </div>
                        </td>

                        <td className={tdCls}>
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
                              background: 'var(--ada-surface-2)',
                              color: alterada ? 'var(--ada-heading)' : 'var(--ada-muted)',
                              cursor: alterada ? 'text' : 'not-allowed',
                              opacity: alterada ? 1 : 0.5,
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
