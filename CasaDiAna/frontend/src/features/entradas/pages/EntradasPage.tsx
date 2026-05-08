import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { useEntradas } from '../hooks/useEntradas'
import { useAuthStore } from '@/store/authStore'
import { FiltrosEntradas } from '../components/FiltrosEntradas'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/ui/SkeletonTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

function BadgeStatus({ status }: { status: string }) {
  if (status === 'Confirmada') return <StatusBadge variante="ativo" label={status} />
  if (status === 'Cancelada') return <StatusBadge variante="critico" label={status} />
  return <StatusBadge variante="baixo" label={status} />
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

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')

  // Reactive fetch: fires on mount and whenever carregar ref changes (dates updated)
  useEffect(() => { carregar() }, [carregar])

  const filtrados = useMemo(() => {
    let result = entradas
    if (busca) {
      const termo = busca.toLowerCase()
      result = result.filter(e =>
        e.fornecedorNome.toLowerCase().includes(termo) ||
        (e.numeroNotaFiscal ?? '').toLowerCase().includes(termo)
      )
    }
    if (status) {
      result = result.filter(e => e.status === status)
    }
    return result
  }, [entradas, busca, status])

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

      <FiltrosEntradas
        busca={busca}
        onBuscaChange={setBusca}
        de={de}
        onDeChange={atualizarDe}
        ate={ate}
        onAteChange={atualizarAte}
        status={status}
        onStatusChange={setStatus}
      />

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <SkeletonTable colunas={7} linhas={5} />}
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
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-td text-center py-10 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        Nenhum resultado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : filtrados.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/entradas/${e.id}`)}
                      className="table-row table-row-clickable"
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {e.fornecedorNome}
                          </span>
                        </div>
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
                        <BadgeStatus status={e.status} />
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
