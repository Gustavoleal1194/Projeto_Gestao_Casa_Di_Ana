import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { useInventarios } from '../hooks/useInventarios'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function getBadgeClass(status: string) {
  if (status === 'EmAndamento') return 'badge badge-warning'
  if (status === 'Finalizado') return 'badge badge-active'
  if (status === 'Cancelado') return 'badge badge-danger'
  return 'badge badge-inactive'
}

function labelStatus(status: string) {
  if (status === 'EmAndamento') return 'Em Andamento'
  return status
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function InventariosPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { inventarios, loading, erro } = useInventarios()
  const podeCriar = temPapel(...PAPEIS_EDICAO)

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Inventários"
        breadcrumb={['Movimentações', 'Inventário']}
        subtitulo={loading ? 'Carregando…' : `${inventarios.length} inventário${inventarios.length !== 1 ? 's' : ''} registrado${inventarios.length !== 1 ? 's' : ''}`}
        actions={podeCriar ? (
          <button onClick={() => navigate('/inventarios/novo')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Novo Inventário
          </button>
        ) : undefined}
      />

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={4} linhas={5} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {inventarios.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhum inventário registrado
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Crie um inventário para contabilizar o estoque.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Data</th>
                    <th className="table-th" scope="col">Descrição</th>
                    <th className="table-th" scope="col">Itens</th>
                    <th className="table-th" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/inventarios/${inv.id}`)}
                      className="table-row table-row-clickable"
                    >
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {formatarData(inv.dataRealizacao)}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: inv.descricao ? 'var(--ada-body)' : 'var(--ada-placeholder)' }}>
                          {inv.descricao ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {inv.totalItens}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={getBadgeClass(inv.status)}>
                          {labelStatus(inv.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
