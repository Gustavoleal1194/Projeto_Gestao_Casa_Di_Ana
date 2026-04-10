import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useEntradas } from '../hooks/useEntradas'
import { useAuthStore } from '@/store/authStore'

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

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Entradas de Mercadoria
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${entradas.length} entrada${entradas.length !== 1 ? 's' : ''} no período`}
          </p>
        </div>
        {podeCriar && (
          <button
            onClick={() => navigate('/entradas/nova')}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Nova Entrada
          </button>
        )}
      </div>

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
      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando entradas…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando entradas…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {entradas.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7H2v5h20V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhuma entrada no período selecionado
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Ajuste o período ou registre uma nova entrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Fornecedor</th>
                    <th className="table-th" scope="col">Nota Fiscal</th>
                    <th className="table-th" scope="col">Data</th>
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
