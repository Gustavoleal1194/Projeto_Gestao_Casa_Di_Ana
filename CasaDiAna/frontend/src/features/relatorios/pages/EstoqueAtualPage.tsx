import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { relatoriosService } from '../services/relatoriosService'
import { gerarPdfEstoqueAtual } from '@/lib/pdf'
import type { EstoqueAtualItem } from '@/types/estoque'

export function EstoqueAtualPage() {
  const [itens, setItens] = useState<EstoqueAtualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasAbaixo, setApenasAbaixo] = useState(false)

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

  const handleToggle = () => {
    const novo = !apenasAbaixo
    setApenasAbaixo(novo)
    carregar(novo)
  }

  return (
    <div className="ada-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Estoque Atual
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ada-muted)' }}>
            {loading ? 'Carregando…' : `${itens.length} ingrediente(s)`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {itens.length > 0 && (
            <button onClick={() => gerarPdfEstoqueAtual(itens, apenasAbaixo)} className="btn-secondary">
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Baixar PDF
            </button>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={apenasAbaixo}
              onChange={handleToggle}
              className="h-4 w-4 accent-amber-700"
            />
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>Apenas abaixo do mínimo</span>
          </label>
        </div>
      </div>

      {loading && (
        <div className="state-loading">
          <div
            className="inline-block h-9 w-9 animate-spin rounded-full mb-4"
            style={{ border: '3px solid var(--ada-border-sub)', borderTopColor: '#C4870A' }}
            role="status" aria-label="Carregando…"
          />
          <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando estoque…</p>
        </div>
      )}
      {!loading && erro && <div className="state-error" role="alert">{erro}</div>}
      {!loading && !erro && itens.length === 0 && (
        <div className="state-loading">
          <p className="text-sm font-semibold" style={{ color: 'var(--ada-body)', fontFamily: 'Sora, system-ui, sans-serif' }}>
            Nenhum ingrediente encontrado
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ada-muted)' }}>
            {apenasAbaixo ? 'Nenhum ingrediente abaixo do mínimo.' : 'Cadastre ingredientes para visualizar o estoque.'}
          </p>
        </div>
      )}
      {!loading && !erro && itens.length > 0 && (
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
                {itens.map(item => (
                  <tr
                    key={item.ingredienteId}
                    className="table-row"
                    style={item.estaBaixoDoMinimo ? { background: 'var(--ada-error-bg)' } : {}}
                  >
                    <td className="table-td">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>{item.nome}</span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm" style={{ color: 'var(--ada-muted)' }}>{item.categoriaNome ?? '—'}</span>
                    </td>
                    <td className="table-td tabular-nums" style={{ textAlign: 'right' }}>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: item.estaBaixoDoMinimo ? 'var(--ada-error-text)' : 'var(--ada-heading)' }}
                      >
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
                      <span className={`badge ${item.estaBaixoDoMinimo ? 'badge-danger' : 'badge-active'}`}>
                        {item.estaBaixoDoMinimo ? 'Abaixo do mínimo' : 'OK'}
                      </span>
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
