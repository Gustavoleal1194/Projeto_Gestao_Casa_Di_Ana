import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useVendasDiarias } from '../hooks/useVendasDiarias'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function VendasDiariasPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { vendas, loading, erro, de, ate, setDe, setAte, carregar } = useVendasDiarias()
  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [produtoFiltro, setProdutoFiltro] = useState('')

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
    carregar()
  }, [carregar])

  const handleFiltrar = () => carregar(de, ate, produtoFiltro || undefined)

  return (
    <div className="ada-page">

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Vendas Diárias
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${vendas.length} venda${vendas.length !== 1 ? 's' : ''} no período`}
          </p>
        </div>
        {podeEditar && (
          <button
            onClick={() => navigate('/producao/vendas/nova')}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Registrar Venda
          </button>
        )}
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="filter-bar" role="search" aria-label="Filtrar vendas">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <div>
          <label htmlFor="venda-de" className="filter-label">De</label>
          <input id="venda-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-ate" className="filter-label">Até</label>
          <input id="venda-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="venda-produto" className="filter-label">Produto</label>
          <select
            id="venda-produto"
            value={produtoFiltro}
            onChange={e => setProdutoFiltro(e.target.value)}
            className="filter-input"
            style={{ paddingRight: '2rem' }}
          >
            <option value="">Todos</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleFiltrar} className="btn-secondary">
          Filtrar
        </button>
      </div>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status"
            aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando vendas…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {vendas.length === 0 ? (
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
                Nenhuma venda registrada no período
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Ajuste os filtros ou registre uma nova venda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Data</th>
                    <th className="table-th" scope="col">Produto</th>
                    <th className="table-th table-th-right" scope="col">Qtd Vendida</th>
                    <th className="table-th" scope="col">Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map(v => (
                    <tr key={v.id} className="table-row">
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                          {new Date(v.data).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {v.produtoNome}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                          {v.quantidadeVendida}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>
                          {new Date(v.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
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
