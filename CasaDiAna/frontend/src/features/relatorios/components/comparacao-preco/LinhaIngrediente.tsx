import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { ComparacaoPrecoIngrediente } from '@/types/estoque'
import { destacar } from '@/utils/destacar'
import { TendenciaBadge } from './TendenciaBadge'
import { HistoricoCompras } from './HistoricoCompras'
import { ComparacaoFornecedores } from './ComparacaoFornecedores'
import { corVariacao, fmtMoeda, fmtPct, idLinhaIngrediente } from './formatadores'

const TOTAL_COLUNAS = 7

interface Props {
  item: ComparacaoPrecoIngrediente
  aberto: boolean
  emFoco: boolean
  busca: string
  onToggle: () => void
}

export function LinhaIngrediente({ item, aberto, emFoco, busca, onToggle }: Props) {
  const cor = corVariacao(item.variacaoValor)
  const Chevron = aberto ? ChevronUpIcon : ChevronDownIcon
  const idLinha = idLinhaIngrediente(item.ingredienteId)

  return (
    <>
      <tr
        id={idLinha}
        className={`table-row table-row-clickable select-none${emFoco ? ' table-row-foco' : ''}`}
        onClick={onToggle}
        aria-expanded={aberto}
      >
        <td className="table-td">
          <div className="flex items-center gap-2">
            <span className="accent-bar shrink-0" aria-hidden="true" />
            <Chevron className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ada-muted)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--ada-heading)' }}>
              {destacar(item.ingredienteNome, busca)}
            </span>
            <span className="text-xs" style={{ color: 'var(--ada-placeholder)' }}>({item.unidadeMedidaCodigo})</span>
          </div>
        </td>
        <td className="table-td tabular-nums text-sm" style={{ textAlign: 'right', color: 'var(--ada-body)' }}>
          {item.precoAnterior !== null ? fmtMoeda(item.precoAnterior) : '—'}
        </td>
        <td className="table-td tabular-nums text-sm font-semibold" style={{ textAlign: 'right', color: 'var(--ada-heading)' }}>
          {item.ultimoPreco !== null ? fmtMoeda(item.ultimoPreco) : '—'}
        </td>
        <td className="table-td tabular-nums" style={{ textAlign: 'right', color: cor }}>
          <span className="text-sm font-semibold">{item.variacaoValor !== null ? fmtMoeda(item.variacaoValor) : '—'}</span>
          {item.variacaoPercentual !== null && <span className="text-xs ml-1">({fmtPct(item.variacaoPercentual)})</span>}
        </td>
        <td className="table-td"><TendenciaBadge tendencia={item.tendenciaPreco} /></td>
        <td className="table-td text-sm" style={{ color: 'var(--ada-body)' }}>
          {item.porFornecedor[0]?.fornecedorNome ?? '—'}
        </td>
        <td className="table-td tabular-nums text-sm" style={{ textAlign: 'right', color: 'var(--ada-muted)' }}>
          {item.historico.length}
        </td>
      </tr>

      {aberto && (
        <tr>
          <td colSpan={TOTAL_COLUNAS} className="p-0">
            <div className="px-6 py-4 space-y-5" style={{ background: 'var(--ada-surface)', borderBottom: '1px solid var(--ada-border)' }}>
              <HistoricoCompras historico={item.historico} />
              <ComparacaoFornecedores fornecedores={item.porFornecedor} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
