import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useProducaoDiaria } from '../hooks/useProducaoDiaria'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { PageHeader } from '@/components/ui/PageHeader'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function ProducaoDiariaPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { producoes, loading, erro, de, ate, setDe, setAte, carregar } = useProducaoDiaria()
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

      <PageHeader
        titulo="Produção Diária"
        breadcrumb={['Produção', 'Produção Diária']}
        subtitulo={loading ? 'Carregando…' : `${producoes.length} registro${producoes.length !== 1 ? 's' : ''} no período`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/producao/diaria/nova')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Registrar Produção
          </button>
        ) : undefined}
      />

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <div className="filter-bar" role="search" aria-label="Filtrar produção">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <div>
          <label htmlFor="prod-de" className="filter-label">De</label>
          <input id="prod-de" type="date" value={de} onChange={e => setDe(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-ate" className="filter-label">Até</label>
          <input id="prod-ate" type="date" value={ate} onChange={e => setAte(e.target.value)} className="filter-input" />
        </div>
        <div>
          <label htmlFor="prod-produto" className="filter-label">Produto</label>
          <select
            id="prod-produto"
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
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando produções…</p>
        </div>
      )}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {producoes.length === 0 ? (
            <div className="state-empty">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--ada-bg)', border: '1px solid var(--ada-border)' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: 'var(--ada-placeholder)' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
                Nenhuma produção registrada no período
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
                Ajuste os filtros ou registre uma nova produção.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-th" scope="col">Data</th>
                    <th className="table-th" scope="col">Produto</th>
                    <th className="table-th table-th-right" scope="col">Qtd Produzida</th>
                    <th className="table-th table-th-right" scope="col">Custo Total</th>
                    <th className="table-th" scope="col">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {producoes.map(p => (
                    <tr key={p.id} className="table-row">
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                          {new Date(p.data).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                          {p.produtoNome}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ada-heading)' }}>
                          {p.quantidadeProduzida}
                        </span>
                      </td>
                      <td className="table-td" style={{ textAlign: 'right' }}>
                        <span className="text-sm tabular-nums" style={{ color: 'var(--ada-body)' }}>
                          {p.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="text-sm" style={{ color: p.observacoes ? 'var(--ada-muted-dim)' : 'var(--ada-placeholder)' }}>
                          {p.observacoes ?? '—'}
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
