import api from '@/lib/api'
import type {
  ApiResponse,
  CategoriaUtensilio,
  CriarCategoriaUtensilioInput,
  AtualizarCategoriaUtensilioInput,
} from '@/types/estoque'

export const categoriasUtensilioService = {
  listar: async (apenasAtivos = true): Promise<CategoriaUtensilio[]> => {
    const resp = await api.get<ApiResponse<CategoriaUtensilio[]>>(
      `/categorias-utensilio?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaUtensilioInput): Promise<CategoriaUtensilio> => {
    const resp = await api.post<ApiResponse<CategoriaUtensilio>>('/categorias-utensilio', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaUtensilioInput): Promise<CategoriaUtensilio> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaUtensilio>>(`/categorias-utensilio/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias-utensilio/${id}`)
  },
}
