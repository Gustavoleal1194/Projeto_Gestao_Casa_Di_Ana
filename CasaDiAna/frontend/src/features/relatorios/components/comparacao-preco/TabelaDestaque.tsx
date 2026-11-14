import type { ComparacaoPrecoIngrediente } from '@/types/estoque'
import { TituloSecao } from './TituloSecao'
import { corVariacao, fmtPct } from './formatadores'

interface Props {
  titulo: string
  itens: ComparacaoPrecoIngrediente[]
  onSelecionar: (ingredienteId: string) => void
}

export function TabelaDestaque({ titulo, itens, onSelecionar }: Props) {
  if (itens.length === 0) return null
  return (
    <div className="ada-surface-card p-4">
      <TituloSecao>{titulo}</TituloSecao>
      <ul className="space-y-0.5">
        {itens.map(item => (
          <li key={item.ingredienteId}>
            <button
              type="button"
              onClick={() => onSelecionar(item.ingredienteId)}
              title="Ver detalhes na comparação"
              className="table-row-clickable w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors"
            >
              <span className="text-sm font-medium truncate" style={{ color: 'var(--ada-body)' }}>
                {item.ingredienteNome}
                <span className="text-xs ml-1" style={{ color: 'var(--ada-placeholder)' }}>({item.unidadeMedidaCodigo})</span>
              </span>
              <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: corVariacao(item.variacaoPercentual) }}>
                {fmtPct(item.variacaoPercentual)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
