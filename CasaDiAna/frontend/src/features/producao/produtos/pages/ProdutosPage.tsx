import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon, DocumentTextIcon, CubeIcon } from '@heroicons/react/20/solid'
import { useProdutos } from '../hooks/useProdutos'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Toast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
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

      <PageHeader
        titulo="Produtos"
        breadcrumb={['Produção', 'Produtos']}
        subtitulo={loading ? 'Carregando…' : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''} cadastrado${produtos.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/producao/produtos/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Produto
          </button>
        ) : undefined}
      />

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={5} linhas={5} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {produtos.length === 0 ? (
            <EmptyState
              icon={<CubeIcon className="w-7 h-7" />}
              iconColor="amber"
              titulo="Nenhum produto cadastrado"
              descricao="Cadastre um produto para registrar produção e vendas."
              action={podeEditar ? (
                <button onClick={() => navigate('/producao/produtos/novo')} className="btn-primary">
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  Novo Produto
                </button>
              ) : undefined}
            />
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
          nome={paraDesativar.nome}
          entidade="produto"
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
