import { useMemo, useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { Paginacao } from '@/components/ui/Paginacao'
import type { HistoricoImpressao, TipoEtiqueta } from '@/lib/etiquetasService'

const ITENS_POR_PAGINA = 10

const TIPO_LABELS: Record<TipoEtiqueta, string> = {
  1: 'Completa',
  2: 'Simples',
  3: 'Nutricional',
}

interface Props {
  historico: HistoricoImpressao[]
}

const thCls = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em]'
const tdCls = 'px-5 py-3.5 text-sm'

export function HistoricoImpressoesTable({ historico }: Props) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'' | '1' | '2' | '3'>('')
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim()
    return historico.filter(h => {
      if (tipoFiltro && String(h.tipoEtiqueta) !== tipoFiltro) return false
      if (t && !h.produtoNome.toLowerCase().includes(t)) return false
      return true
    })
  }, [historico, busca, tipoFiltro])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const handleBusca = (v: string) => { setBusca(v); setPagina(1) }
  const handleTipo = (v: typeof tipoFiltro) => { setTipoFiltro(v); setPagina(1) }

  return (
    <div
      className="rounded-xl border"
      style={{ background: 'var(--ada-surface)', borderColor: 'var(--ada-border)' }}
    >
      <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--ada-border)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ClockIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--ada-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
            Histórico de Impressões
          </h2>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--ada-hover)', color: 'var(--ada-muted)' }}>
            {historico.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Buscar produto…"
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm border outline-none"
            style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)', width: 160 }}
          />
          <select
            value={tipoFiltro}
            onChange={e => handleTipo(e.target.value as typeof tipoFiltro)}
            className="rounded-lg px-2 py-1.5 text-sm border outline-none"
            style={{ background: 'var(--ada-bg)', borderColor: 'var(--ada-border)', color: 'var(--ada-body)' }}
          >
            <option value="">Todos os tipos</option>
            <option value="1">Completa</option>
            <option value="2">Simples</option>
            <option value="3">Nutricional</option>
          </select>
        </div>
      </div>

      {paginados.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--ada-muted)' }}>
          {historico.length === 0 ? 'Nenhuma impressão registrada ainda.' : 'Nenhum resultado para os filtros aplicados.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ background: 'var(--ada-surface-2)', borderBottom: '1px solid var(--ada-border-sub)' }}>
                {['Produto', 'Tipo', 'Qtd', 'Data de Produção', 'Impresso em'].map(h => (
                  <th key={h} className={thCls} style={{ color: 'var(--ada-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginados.map((h, idx) => (
                <tr
                  key={h.id}
                  className="transition-colors duration-100"
                  style={{ borderBottom: idx < paginados.length - 1 ? '1px solid var(--ada-hover)' : 'none', background: 'var(--ada-surface)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ada-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--ada-surface)')}
                >
                  <td className={tdCls} style={{ color: 'var(--ada-heading)', fontWeight: 600 }}>
                    {h.produtoNome}
                  </td>
                  <td className={tdCls}>
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--ada-hover)', color: 'var(--ada-body)' }}>
                      {TIPO_LABELS[h.tipoEtiqueta]}
                    </span>
                  </td>
                  <td className={tdCls} style={{ color: 'var(--ada-body)' }}>{h.quantidade}</td>
                  <td className={tdCls} style={{ color: 'var(--ada-body)' }}>
                    {new Date(h.dataProducao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className={`${tdCls} text-xs`} style={{ color: 'var(--ada-muted)' }}>
                    {new Date(h.impressoEm).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        totalItens={filtrados.length}
        itensPorPagina={ITENS_POR_PAGINA}
        onPaginaChange={setPagina}
      />
    </div>
  )
}
