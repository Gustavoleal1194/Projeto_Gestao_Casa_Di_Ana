import api from '@/lib/api'
import type {
  ApiResponse,
  CriarUtensilioInput,
  AtualizarUtensilioInput,
  Utensilio,
  UtensilioResumo,
} from '@/types/estoque'

const BASE = '/utensilios'

export const utensiliosService = {
  listar: async (apenasAtivos = true): Promise<UtensilioResumo[]> => {
    const resp = await api.get<ApiResponse<UtensilioResumo[]>>(
      `${BASE}?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Utensilio> => {
    const resp = await api.get<ApiResponse<Utensilio>>(`${BASE}/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarUtensilioInput): Promise<Utensilio> => {
    const resp = await api.post<ApiResponse<Utensilio>>(BASE, input)
    return resp.data.dados
  },

  atualizar: async ({ id, ...body }: AtualizarUtensilioInput): Promise<Utensilio> => {
    const resp = await api.put<ApiResponse<Utensilio>>(`${BASE}/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
