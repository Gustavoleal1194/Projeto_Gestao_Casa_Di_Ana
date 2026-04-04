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
    <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ada-heading)' }}>
          Estoque Atual
        </h1>
        <div className="flex items-center gap-4">
          {itens.length > 0 && (
            <button
              onClick={() => gerarPdfEstoqueAtual(itens, apenasAbaixo)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--ada-border)',
                color: 'var(--ada-body)',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Baixar PDF
            </button>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasAbaixo}
              onChange={handleToggle}
              className="h-4 w-4 accent-amber-700"
            />
            <span className="text-sm" style={{ color: 'var(--ada-body)' }}>
              Apenas abaixo do mínimo
            </span>
          </label>
        </div>
      </div>

      {loading && (
        <div
          className="rounded-xl py-16 text-center"
          style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-amber-700"
            style={{ borderColor: 'var(--ada-border)', borderTopColor: '#C4870A' }}
          />
          <p className="mt-3 text-sm" style={{ color: 'var(--ada-muted)' }}>Carregando...</p>
        </div>
      )}

      {!loading && erro && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'var(--ada-error-bg)',
            border: '1px solid var(--ada-error-border)',
            color: 'var(--ada-error-text, #b91c1c)',
          }}
        >
          {erro}
        </div>
      )}

      {!loading && !erro && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--ada-surface)', boxShadow: 'var(--shadow-sm)' }}
        >
          {itens.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'var(--ada-muted)' }}>
                Nenhum ingrediente encontrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border)' }}>
                  <tr>
                    {['Ingrediente', 'Categoria', 'Estoque Atual', 'Mínimo', 'Máximo', 'Situação'].map((col, i) => (
                      <th
                        key={col}
                        className={`text-xs font-semibold uppercase tracking-wide px-4 py-3 ${i >= 2 && i <= 4 ? 'text-right' : 'text-left'}`}
                        style={{ color: 'var(--ada-muted)' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => (
                    <tr
                      key={item.ingredienteId}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid var(--ada-border-sub)',
                        background: item.estaBaixoDoMinimo ? 'var(--ada-error-bg)' : undefined,
                      }}
                      onMouseEnter={e => {
                        if (!item.estaBaixoDoMinimo)
                          (e.currentTarget as HTMLElement).style.background = 'var(--ada-row-alert-hover)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background =
                          item.estaBaixoDoMinimo ? 'var(--ada-error-bg)' : ''
                      }}
                    >
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ada-heading)' }}>
                        {item.nome}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--ada-muted)' }}>
                        {item.categoriaNome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        <span style={{ color: item.estaBaixoDoMinimo ? 'var(--ada-danger-text, #dc2626)' : 'var(--ada-heading)' }}>
                          {item.estoqueAtual} {item.unidadeMedidaCodigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ada-body)' }}>
                        {item.estoqueMinimo} {item.unidadeMedidaCodigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ada-body)' }}>
                        {item.estoqueMaximo != null ? `${item.estoqueMaximo} ${item.unidadeMedidaCodigo}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.estaBaixoDoMinimo ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--ada-error-badge)',
                              color: 'var(--ada-error-text)',
                              border: '1px solid var(--ada-error-border)',
                            }}
                          >
                            Abaixo do mínimo
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--ada-success-bg)',
                              color: 'var(--ada-success-text)',
                              border: '1px solid var(--ada-success-border)',
                            }}
                          >
                            OK
                          </span>
                        )}
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
