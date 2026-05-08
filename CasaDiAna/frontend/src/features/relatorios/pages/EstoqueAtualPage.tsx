import { useEffect, useState, useMemo } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { gerarPdfEstoqueAtual } from '@/lib/pdf'
import { FiltrosEstoqueAtual } from '../components/FiltrosEstoqueAtual'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { EstoqueAtualItem } from '@/types/estoque'

export function EstoqueAtualPage() {
  const [itens, setItens] = useState<EstoqueAtualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasAbaixo, setApenasAbaixo] = useState(false)
  const [busca, setBusca] = useState('')

  const carregar = async (filtro: boolean) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await relatoriosService.estoqueAtual(filtro)
      setItens(data)
    } catch {
      setErro('Erro ao carregar relatório de estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar(false) }, [])

  const handleApenasAbaixoChange = (v: boolean) => {
    setApenasAbaixo(v)
    carregar(v)
  }

  const itensFiltrados = useMemo(() => {
    if (!busca) return itens
    const termo = busca.toLowerCase()
    return itens.filter(item =>
      item.nome.toLowerCase().includes(termo) ||
      (item.categoriaNome ?? '').toLowerCase().includes(termo)
    )
  }, [itens, busca])

  return (
    <div className="ada-page">
      <PageHeader
        titulo="Estoque Atual"
        breadcrumb={['Relatórios', 'Estoque Atual']}
        subtitulo={loading ? 'Carregando…' : `${itensFiltrados.length} ingrediente(s)`}
        actions={itens.length > 0 ? (
          <button onClick={() => gerarPdfEstoqueAtual(itens, apenasAbaixo)} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            Baixar PDF
          </button>
        ) : undefined}
      />

      <FiltrosEstoqueAtual
        busca={busca}
        onBuscaChange={setBusca}
        apenasAbaixo={apenasAbaixo}
        onApenasAbaixoChange={handleApenasAbaixoChange}
      />

      {loading && <LoadingState mensagem="Carregando estoque…" />}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && itensFiltrados.length === 0 && (
        <div className="state-loading">
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhum ingrediente encontrado
          </p>
          <p className="text-xs" style={{ color: 'var(--ada-muted)' }}>
            {apenasAbaixo ? 'Nenhum ingrediente abaixo do mínimo.' : 'Cadastre ingredientes para visualizar o estoque.'}
          </p>
        </div>
      )}
      {!loading && !erro && itensFiltrados.length > 0 && (
        <div className="ada-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th" scope="col">Ingrediente</th>
                  <th className="table-th" scope="col">Categoria</th>
                  <th className="table-th table-th-right" scope="col">Estoque Atual</th>
                  <th className="table-th table-th-right" scope="col">Mínimo</th>
                  <th className="table-th table-th-right" scope="col">Máximo</th>
                  <th className="table-th" scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map(item => (
                  <tr
                    key={item.ingredienteId}
                    className="table-row"
                    style={item.estaBaixoDoMinimo ? { background: 'var(--ada-error-bg)' } : {}}
                  >
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <span className={`accent-bar shrink-0${item.estaBaixoDoMinimo ? ' accent-bar-alert' : ''}`} aria-hidden="true" />
                        <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.nome}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>{item.categoriaNome ?? '—'}</span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm font-semibold" style={{ color: item.estaBaixoDoMinimo ? 'var(--ada-error-text)' : 'var(--ada-heading)' }}>
                        {item.estoqueAtual} {item.unidadeMedidaCodigo}
                      </span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                        {item.estoqueMinimo} {item.unidadeMedidaCodigo}
                      </span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
                        {item.estoqueMaximo != null ? `${item.estoqueMaximo} ${item.unidadeMedidaCodigo}` : '—'}
                      </span>
                    </td>
                    <td className="table-td">
                      <StatusBadge
                        variante={item.estaBaixoDoMinimo ? 'critico' : 'ativo'}
                        label={item.estaBaixoDoMinimo ? 'Abaixo do mínimo' : 'OK'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
