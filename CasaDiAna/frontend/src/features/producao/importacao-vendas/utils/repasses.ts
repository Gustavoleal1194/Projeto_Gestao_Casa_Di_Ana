import type { ItemPreview, TipoRepasse } from '@/types/importacao'

export const TIPO_REPASSE_LABELS: Record<TipoRepasse, string> = {
  taxaServico: 'Taxa de serviço',
  entrega: 'Entrega',
}

export interface TotaisRepasse {
  taxaServico: number
  entregas: number
}

// Calculado dos itens atuais (e não dos totais da prévia) para refletir
// linhas removidas pelo usuário antes de confirmar.
export function somarRepasses(itens: ItemPreview[]): TotaisRepasse {
  return itens.reduce<TotaisRepasse>(
    (acc, i) => {
      if (i.tipoRepasse === 'taxaServico') acc.taxaServico += i.valorTotal
      else if (i.tipoRepasse === 'entrega') acc.entregas += i.valorTotal
      return acc
    },
    { taxaServico: 0, entregas: 0 },
  )
}
