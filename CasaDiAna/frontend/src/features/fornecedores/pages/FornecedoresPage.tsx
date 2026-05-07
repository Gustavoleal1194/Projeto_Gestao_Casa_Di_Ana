import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { TruckIcon } from '@heroicons/react/24/outline'
import { TabelaAcoesLinha } from '@/components/ui/TabelaAcoesLinha'
import { useFornecedores } from '../hooks/useFornecedores'
import { useAuthStore } from '@/store/authStore'
import { ModalDesativar } from '@/components/ui/ModalDesativar'
import { Toast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
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
            <EmptyState
              icon={<TruckIcon className="w-7 h-7" />}
              iconColor="neutral"
              titulo="Nenhum fornecedor cadastrado"
              descricao="Cadastre um fornecedor para registrar entradas de mercadoria."
            />
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
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                              {f.razaoSocial}
                            </p>
                            {f.nomeFantasia && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--ada-muted)' }}>
                                {f.nomeFantasia}
                              </p>
                            )}
                          </div>
                        </div>
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
                        <StatusBadge variante={f.ativo ? 'ativo' : 'inativo'} />
                      </td>
                      {podeEditar && (
                        <td className="table-td text-right group">
                          <TabelaAcoesLinha
                            onEditar={() => navigate(`/fornecedores/${f.id}/editar`)}
                            onDesativar={() => setParaDesativar(f)}
                            labelEditar={`Editar ${f.razaoSocial}`}
                            labelDesativar={`Desativar ${f.razaoSocial}`}
                          />
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
          nome={paraDesativar.razaoSocial}
          entidade="fornecedor"
          loading={desativando}
          onConfirmar={handleDesativar}
          onCancelar={() => setParaDesativar(null)}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
