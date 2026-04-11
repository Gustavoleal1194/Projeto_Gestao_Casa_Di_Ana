import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'
import { useFornecedores } from '../hooks/useFornecedores'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/features/estoque/ingredientes/components/ModalDesativar'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import type { Fornecedor } from '@/types/estoque'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function FornecedoresPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { fornecedores, loading, erro, desativar } = useFornecedores()
  const podeEditar = temPapel(...PAPEIS_EDICAO)

  const [paraDesativar, setParaDesativar] = useState<Fornecedor | null>(null)
  const [desativando, setDesativando] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  const handleDesativar = async () => {
    if (!paraDesativar) return
    setDesativando(true)
    try {
      await desativar(paraDesativar.id)
      setParaDesativar(null)
      setToast({ tipo: 'sucesso', mensagem: 'Fornecedor desativado.' })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao desativar fornecedor.' })
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Fornecedores"
        breadcrumb={['Cadastros', 'Fornecedores']}
        subtitulo={loading ? 'Carregando…' : `${fornecedores.length} fornecedor${fornecedores.length !== 1 ? 'es' : ''} cadastrado${fornecedores.length !== 1 ? 's' : ''}`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/fornecedores/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Fornecedor
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
          {fornecedores.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhum fornecedor cadastrado
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Cadastre um fornecedor para registrar entradas de mercadoria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Razão Social</th>
                    <th className="table-th" scope="col">CNPJ</th>
                    <th className="table-th" scope="col">Telefone</th>
                    <th className="table-th" scope="col">Status</th>
                    {podeEditar && (
                      <th className="table-th table-th-right" scope="col">
                        <span className="sr-only">Ações</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.map(f => (
                    <tr key={f.id} className="table-row group">
                      <td className="table-td">
                        <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {f.razaoSocial}
                        </p>
                        {f.nomeFantasia && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>
                            {f.nomeFantasia}
                          </p>
                        )}
                      </td>
                      <td className="table-td">
                        <span className="text-[12.5px] font-mono tracking-wide" style={{ color: f.cnpj ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                          {f.cnpj ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: f.telefone ? 'var(--ada-body)' : 'var(--ada-placeholder)' }}>
                          {f.telefone ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={f.ativo ? 'badge badge-active' : 'badge badge-inactive'}>
                          {f.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {podeEditar && (
                        <td className="table-td" style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => navigate(`/fornecedores/${f.id}/editar`)}
                              aria-label={`Editar ${f.razaoSocial}`}
                              className="row-action-btn"
                            >
                              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => setParaDesativar(f)}
                              aria-label={`Desativar ${f.razaoSocial}`}
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
          nomeIngrediente={paraDesativar.razaoSocial}
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
