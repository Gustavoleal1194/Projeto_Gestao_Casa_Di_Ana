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

export interface VdCampos {
  vdValorEnergetico: string | null
  vdCarboidratos: string | null
  vdAcucaresAdicionados: string | null
  vdProteinas: string | null
  vdGordurasTotais: string | null
  vdGordurasSaturadas: string | null
  vdGordurasTrans: string | null
  vdFibraAlimentar: string | null
  vdSodio: string | null
  nome: string | null
}

export interface ModeloNutricional extends VdCampos {
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
  alergicoAlimentar: string | null
  contemGluten: boolean
  contemLactose: boolean
  loteFabricacao: string | null
  ingredientes: string | null
}

export interface ModeloNutricionalResumo extends VdCampos {
  id: string
  produtoId: string
  produtoNome: string
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
  alergicoAlimentar: string | null
  contemGluten: boolean
  contemLactose: boolean
  loteFabricacao: string | null
  ingredientes: string | null
}

export interface SalvarModeloNutricionalInput extends VdCampos {
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
  alergicoAlimentar: string | null
  contemGluten: boolean
  contemLactose: boolean
  loteFabricacao: string | null
  ingredientes: string | null
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

  async listarModelosNutricionais(): Promise<ModeloNutricionalResumo[]> {
    const res = await api.get<ApiResponse<ModeloNutricionalResumo[]>>('/etiquetas/modelos-nutricionais')
    return res.data.dados
  },

  async renomearModelo(produtoId: string, nome: string | null): Promise<ModeloNutricional> {
    const res = await api.patch<ApiResponse<ModeloNutricional>>(
      `/etiquetas/modelos-nutricionais/${produtoId}/nome`,
      { nome },
    )
    return res.data.dados
  },

  async excluirModelo(produtoId: string): Promise<void> {
    await api.delete(`/etiquetas/modelos-nutricionais/${produtoId}`)
  },
}
