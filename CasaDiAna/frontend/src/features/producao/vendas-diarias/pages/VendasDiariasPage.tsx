import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { useVendasDiarias } from '../hooks/useVendasDiarias'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
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

  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate, produtoFiltro || undefined)
  }

  return (
    <div className="ada-page">

      <PageHeader
        titulo="Vendas Diárias"
        breadcrumb={['Produção', 'Vendas Diárias']}
        subtitulo={loading ? 'Carregando…' : `${vendas.length} venda${vendas.length !== 1 ? 's' : ''} no período`}
        actions={podeEditar ? (
          <button onClick={() => navigate('/producao/vendas/nova')} className="btn-primary">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Registrar Venda
          </button>
        ) : undefined}
      />

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar vendas">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <FiltroPeriodo de={de} onChangeDe={setDe} ate={ate} onChangeAte={setAte} idDe="venda-de" idAte="venda-ate" />
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
        <FilterBarActions
          loading={loading}
          chips={[
            ...gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte('')),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <LoadingState mensagem="Carregando vendas…" />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {vendas.length === 0 ? (
            <EmptyState
              icon={<BanknotesIcon className="w-7 h-7" />}
              iconColor="green"
              titulo="Nenhuma venda no período"
              descricao="Ajuste os filtros ou registre uma nova venda."
            />
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
