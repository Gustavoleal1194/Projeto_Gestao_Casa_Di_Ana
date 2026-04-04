import api from './api'

export type TipoEtiqueta = 1 | 2 | 3

export interface HistoricoImpressao {
  id: string
  produtoId: string
  produtoNome: string
  tipoEtiqueta: TipoEtiqueta
  quantidade: number
  dataProducao: string
  impressoEm: string
}

export interface RegistrarImpressaoInput {
  produtoId: string
  tipoEtiqueta: TipoEtiqueta
  quantidade: number
  dataProducao: string
}

interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

export const etiquetasService = {
  async listarHistorico(produtoId?: string): Promise<HistoricoImpressao[]> {
    const params = produtoId ? `?produtoId=${produtoId}` : ''
    const res = await api.get<ApiResponse<HistoricoImpressao[]>>(`/etiquetas/historico${params}`)
    return res.data.dados
  },

  async registrarImpressao(input: RegistrarImpressaoInput): Promise<HistoricoImpressao> {
    const res = await api.post<ApiResponse<HistoricoImpressao>>('/etiquetas/historico', input)
    return res.data.dados
  },
}
