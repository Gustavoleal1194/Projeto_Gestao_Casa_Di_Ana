import api from '@/lib/api'
import type {
  ApiResponse,
  CriarIngredienteInput,
  AtualizarIngredienteInput,
  Ingrediente,
  IngredienteResumo,
} from '@/types/estoque'

const BASE = '/ingredientes'

export const ingredientesService = {
  listar: async (apenasAtivos = true): Promise<IngredienteResumo[]> => {
    const resp = await api.get<ApiResponse<IngredienteResumo[]>>(
      `${BASE}?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Ingrediente> => {
    const resp = await api.get<ApiResponse<Ingrediente>>(`${BASE}/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarIngredienteInput): Promise<Ingrediente> => {
    const resp = await api.post<ApiResponse<Ingrediente>>(BASE, input)
    return resp.data.dados
  },

  atualizar: async ({ id, ...body }: AtualizarIngredienteInput): Promise<Ingrediente> => {
    const resp = await api.put<ApiResponse<Ingrediente>>(`${BASE}/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
