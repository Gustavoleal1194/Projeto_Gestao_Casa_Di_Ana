import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { useInventarios } from '../hooks/useInventarios'
import { useAuthStore } from '@/store/authStore'
import { FiltrosInventarios } from '../components/FiltrosInventarios'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { BadgeVariante } from '@/components/ui/StatusBadge'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function getBadgeVariante(status: string): BadgeVariante {
  if (status === 'EmAndamento') return 'baixo'
  if (status === 'Finalizado') return 'ativo'
  if (status === 'Cancelado') return 'critico'
  return 'inativo'
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

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')

  const filtrados = useMemo(() => {
    let result = inventarios
    if (busca) {
      const termo = busca.toLowerCase()
      result = result.filter(inv => (inv.descricao ?? '').toLowerCase().includes(termo))
    }
    if (status) {
      result = result.filter(inv => inv.status === status)
    }
    return result
  }, [inventarios, busca, status])

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

      <FiltrosInventarios
        busca={busca}
        onBuscaChange={setBusca}
        status={status}
        onStatusChange={setStatus}
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
            <EmptyState
              icon={<ClipboardDocumentCheckIcon className="w-7 h-7" />}
              iconColor="neutral"
              titulo="Nenhum inventário registrado"
              descricao="Crie um inventário para contabilizar o estoque."
            />
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
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-td text-center py-10 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        Nenhum resultado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : filtrados.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/inventarios/${inv.id}`)}
                      className="table-row table-row-clickable"
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {formatarData(inv.dataRealizacao)}
                          </span>
                        </div>
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
                        <StatusBadge variante={getBadgeVariante(inv.status)} label={labelStatus(inv.status)} />
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
