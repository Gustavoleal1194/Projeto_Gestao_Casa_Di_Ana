import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { TotalCategoria } from '../../despesas/services/despesasService'

export interface FechamentoMensal {
  competencia: string
  faturamentoCalculado: number
  faturamentoManual: number | null
  faturamentoUsado: number
  custoDiretoTotal: number
  totalDespesasFixas: number
  totalDespesasVariaveis: number
  totalCompras: number
  totalSaidas: number
  folhaPagamento: number
  despesaFixaPercentual: number | null
  margemBruta: number
  margemOperacional: number
  primeCost: number
  despesasPorCategoria: TotalCategoria[]
}

export const fechamentoService = {
  obter: async (competencia: string): Promise<FechamentoMensal> => {
    const resp = await api.get<ApiResponse<FechamentoMensal>>(
      `/fechamento-mensal?competencia=${competencia}`,
    )
    return resp.data.dados
  },

  definirFaturamentoManual: async (
    competencia: string,
    valorManual: number | null,
  ): Promise<void> => {
    await api.put('/fechamento-mensal/faturamento-manual', { competencia, valorManual })
  },
}
