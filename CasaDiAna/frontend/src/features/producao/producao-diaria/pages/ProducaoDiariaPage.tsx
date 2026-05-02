import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { CalendarIcon, FireIcon } from '@heroicons/react/24/outline'
import { useProducaoDiaria } from '../hooks/useProducaoDiaria'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterBarActions } from '@/components/ui/FilterBar'
import { FiltroPeriodo, gerarChipsPeriodo } from '@/components/ui/FiltroPeriodo'
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

  const handleFiltrar = (e?: React.FormEvent) => {
    e?.preventDefault()
    carregar(de, ate, produtoFiltro || undefined)
  }

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
      <FilterBar onSubmit={handleFiltrar} ariaLabel="Filtrar produção">
        <CalendarIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-placeholder)' }} aria-hidden="true" />
        <FiltroPeriodo
          de={de}
          onChangeDe={setDe}
          ate={ate}
          onChangeAte={setAte}
        />
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
        <FilterBarActions
          loading={loading}
          chips={[
            ...gerarChipsPeriodo(de, ate, () => setDe(''), () => setAte('')),
            ...(produtoFiltro ? [{ label: `Produto: ${produtos.find(p => p.id === produtoFiltro)?.nome ?? produtoFiltro}`, onRemove: () => setProdutoFiltro('') }] : []),
          ]}
        />
      </FilterBar>

      {/* ── Estados ────────────────────────────────────────────────────── */}
      {loading && <LoadingState mensagem="Carregando produções…" />}
      {!loading && erro && (
        <div className="state-error" role="alert">{erro}</div>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      {!loading && !erro && (
        <div className="ada-surface-card">
          {producoes.length === 0 ? (
            <EmptyState
              icon={<FireIcon className="w-7 h-7" />}
              iconColor="amber"
              titulo="Nenhuma produção no período"
              descricao="Ajuste os filtros ou registre uma nova produção."
            />
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
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {p.produtoNome}
                          </span>
                        </div>
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
