import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

export interface ConfiguracaoPrecificacao {
  cmvAlvo: number
  margemDesejada: number
  taxas: number
}

export interface ProdutoPrecificacao {
  id: string
  nome: string
  categoriaNome: string | null
  precoVenda: number
  custoDireto: number
  temFicha: boolean
}

export interface AnalisePrecificacao {
  competencia: string
  despesaFixaPercentual: number | null
  config: ConfiguracaoPrecificacao
  produtos: ProdutoPrecificacao[]
}

export const precificacaoService = {
  obterConfig: async (): Promise<ConfiguracaoPrecificacao> => {
    const resp = await api.get<ApiResponse<ConfiguracaoPrecificacao>>('/precificacao/configuracao')
    return resp.data.dados
  },

  atualizarConfig: async (input: ConfiguracaoPrecificacao): Promise<ConfiguracaoPrecificacao> => {
    const resp = await api.put<ApiResponse<ConfiguracaoPrecificacao>>('/precificacao/configuracao', input)
    return resp.data.dados
  },

  obterAnalise: async (competencia: string): Promise<AnalisePrecificacao> => {
    const resp = await api.get<ApiResponse<AnalisePrecificacao>>(
      `/precificacao/analise?competencia=${competencia}`,
    )
    return resp.data.dados
  },
}
