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

export interface ModeloNutricional {
  id: string
  produtoId: string
  porcao: string
  valorEnergeticoKcal: number
  valorEnergeticoKJ: number
  carboidratos: number
  acucaresTotais: number
  acucaresAdicionados: number
  proteinas: number
  gordurasTotais: number
  gordurasSaturadas: number
  gordurasTrans: number
  fibraAlimentar: number
  sodio: number
  porcoesPorEmbalagem: number | null
  medidaCaseira: string | null
}

export interface SalvarModeloNutricionalInput {
  porcao: string
  valorEnergeticoKcal: number
  valorEnergeticoKJ: number
  carboidratos: number
  acucaresTotais: number
  acucaresAdicionados: number
  proteinas: number
  gordurasTotais: number
  gordurasSaturadas: number
  gordurasTrans: number
  fibraAlimentar: number
  sodio: number
  porcoesPorEmbalagem: number | null
  medidaCaseira: string | null
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

  async obterModeloNutricional(produtoId: string): Promise<ModeloNutricional | null> {
    const res = await api.get<ApiResponse<ModeloNutricional | null>>(`/etiquetas/modelos-nutricionais/${produtoId}`)
    return res.data.dados
  },

  async salvarModeloNutricional(produtoId: string, input: SalvarModeloNutricionalInput): Promise<ModeloNutricional> {
    const res = await api.put<ApiResponse<ModeloNutricional>>(`/etiquetas/modelos-nutricionais/${produtoId}`, input)
    return res.data.dados
  },
}
