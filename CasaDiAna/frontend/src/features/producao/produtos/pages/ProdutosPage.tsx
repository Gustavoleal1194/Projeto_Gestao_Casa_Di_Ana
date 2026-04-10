import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/20/solid'
import { useProdutos } from '../hooks/useProdutos'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function ProdutosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { produtos, loading, erro, desativar } = useProdutos()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [paraDesativar, setParaDesativar] = useState<ProdutoResumo | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Produto desativado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar produto.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="ada-page">

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Produtos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading
              ? 'Carregando…'
              : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''} cadastrado${produtos.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {podeEditar && (
          <button
            onClick={() => navigate('/producao/produtos/novo')}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Produto
          </button>
        )}
      </div>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando produtos…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando produtos…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {produtos.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhum produto cadastrado
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Cadastre um produto para registrar produção e vendas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Nome</th>
                    <th className="table-th" scope="col">Categoria</th>
                    <th className="table-th table-th-right" scope="col">Preço de Venda</th>
                    <th className="table-th" scope="col">Status</th>
                    {podeEditar && (
                      <th className="table-th table-th-right" scope="col">
                        <span className="sr-only">Ações</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {produtos.map(p => (
                    <tr key={p.id} className="table-row group">
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {p.nome}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: p.categoriaNome ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                          {p.categoriaNome ?? '—'}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                          {p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={p.ativo ? 'badge badge-active' : 'badge badge-inactive'}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {podeEditar && (
                        <td className="table-td" style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => navigate(`/producao/produtos/${p.id}/ficha-tecnica`)}
                              aria-label={`Ficha técnica de ${p.nome}`}
                              title="Ficha Técnica"
                              className="row-action-btn"
                            >
                              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => navigate(`/producao/produtos/${p.id}/editar`)}
                              aria-label={`Editar ${p.nome}`}
                              className="row-action-btn"
                            >
                              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => setParaDesativar(p)}
                              aria-label={`Desativar ${p.nome}`}
                              className="row-action-btn danger"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modais ─────────────────────────────────────────────────────── */}
      {paraDesativar && (
        <ModalDesativar
          nomeIngrediente={paraDesativar.nome}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
