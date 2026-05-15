import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import { useVendasDiarias } from '../hooks/useVendasDiarias'
import { useAuthStore } from '@/store/authStore'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { FiltrosVendasDiarias } from '../components/FiltrosVendasDiarias'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ProdutoResumo } from '@/types/producao'

const PAPEIS_EDICAO = ['Admin', 'Coordenador', 'Compras']

export function VendasDiariasPage() {
  const navigate = useNavigate()
  const { temPapel } = useAuthStore()
  const { vendas, loading, erro, de, ate, setDe, setAte, carregar } = useVendasDiarias()
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

  const vendasFiltradas = useMemo(() => {
    if (!busca) return vendas
    const termo = busca.toLowerCase()
    return vendas.filter(v => v.produtoNome.toLowerCase().includes(termo))
  }, [vendas, busca])

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

      <FiltrosVendasDiarias
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
                  {vendasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-td text-center py-10 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        Nenhum resultado para "{busca}".
                      </td>
                    </tr>
                  ) : vendasFiltradas.map(v => (
                    <tr key={v.id} className="table-row">
                      <td className="table-td">
                        <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                          {new Date(v.data).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <span className="accent-bar shrink-0" aria-hidden="true" />
                          <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
                            {v.produtoNome}
                          </span>
                        </div>
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
