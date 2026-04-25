import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { useEntradas } from '../hooks/useEntradas'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function badgeStatus(status: string) {
  if (status === 'Confirmada') return 'badge badge-active'
  if (status === 'Cancelada') return 'badge badge-danger'
  return 'badge badge-warning'
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
    <div className="ada-page">

      <PageHeader
        titulo="Entradas de Mercadoria"
        breadcrumb={['Movimentações', 'Entradas']}
        subtitulo={loading ? 'Carregando…' : `${entradas.length} entrada${entradas.length !== 1 ? 's' : ''} no período`}
        actions={podeCriar ? (
          <button onClick={() => navigate('/entradas/nova')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Entrada
          </button>
        ) : undefined}
      />

      {/* ── Filtro de período ───────────────────────────────────────────── */}
      <form onSubmit={handleFiltrar} className="filter-bar" aria-label="Filtrar entradas">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <div>
          <label htmlFor="entrada-de" className="filter-label">De</label>
          <input
            id="entrada-de"
            type="date"
            value={de}
            onChange={e => atualizarDe(e.target.value)}
            className="filter-input"
          />
        </div>
        <div>
          <label htmlFor="entrada-ate" className="filter-label">Até</label>
          <input
            id="entrada-ate"
            type="date"
            value={ate}
            onChange={e => atualizarAte(e.target.value)}
            className="filter-input"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={6} linhas={5} />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {entradas.length === 0 ? (
            <EmptyState
              icon={<ArchiveBoxIcon className="w-7 h-7" />}
              iconColor="green"
              titulo="Nenhuma entrada no período"
              descricao="Ajuste o período ou registre uma nova entrada."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Fornecedor</th>
                    <th className="table-th" scope="col">Nota Fiscal</th>
                    <th className="table-th" scope="col">Data</th>
                    <th className="table-th" scope="col">Recebido por</th>
                    <th className="table-th" scope="col">Itens</th>
                    <th className="table-th table-th-right" scope="col">Custo Total</th>
                    <th className="table-th" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/entradas/${e.id}`)}
                      className="table-row table-row-clickable"
                    >
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {e.fornecedorNome}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-[12.5px] font-mono tracking-wide" style={{ color: e.numeroNotaFiscal ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                          {e.numeroNotaFiscal ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                          {formatarData(e.dataEntrada)}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: e.recebidoPor ? 'var(--ada-body)' : 'var(--ada-placeholder)' }}>
                          {e.recebidoPor ?? '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {e.totalItens}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                          {formatarMoeda(e.custoTotal)}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={badgeStatus(e.status)}>{e.status}</span>
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
