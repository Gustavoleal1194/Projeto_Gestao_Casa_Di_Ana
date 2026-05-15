import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { FireIcon } from '@heroicons/react/24/outline'
import { useProducaoDiaria } from '../hooks/useProducaoDiaria'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { FiltrosProducaoDiaria } from '../components/FiltrosProducaoDiaria'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function ProducaoDiariaPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { producoes, loading, erro, de, ate, setDe, setAte, carregar } = useProducaoDiaria()
  const podeEditar = temPapel(...PAPEIS_EDICAO)
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [produtoFiltros, setProdutoFiltros] = useState<string[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    produtosService.listar().then(setProdutos).catch(() => {})
  }, [])

  useEffect(() => { carregar() }, [])

  const handleDeChange = (v: string) => { setDe(v); carregar(v, ate, produtoFiltros.length > 0 ? produtoFiltros : undefined) }
  const handleAteChange = (v: string) => { setAte(v); carregar(de, v, produtoFiltros.length > 0 ? produtoFiltros : undefined) }
  const handleProdutoChange = (ids: string[]) => { setProdutoFiltros(ids); carregar(de, ate, ids.length > 0 ? ids : undefined) }

  const producoesFiltradas = useMemo(() => {
    if (!busca) return producoes
    const termo = busca.toLowerCase()
    return producoes.filter(p =>
      p.produtoNome.toLowerCase().includes(termo) ||
      (p.observacoes ?? '').toLowerCase().includes(termo)
    )
  }, [producoes, busca])

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

      <FiltrosProducaoDiaria
        busca={busca}
        onBuscaChange={setBusca}
        de={de}
        onDeChange={handleDeChange}
        ate={ate}
        onAteChange={handleAteChange}
        produtoIds={produtoFiltros}
        onProdutoChange={handleProdutoChange}
        produtos={produtos}
      />

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
                  {producoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-td text-center py-10 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        Nenhum resultado para "{busca}".
                      </td>
                    </tr>
                  ) : producoesFiltradas.map(p => (
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
