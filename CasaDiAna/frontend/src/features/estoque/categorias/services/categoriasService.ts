import api from '@/lib/api'
import type {
  ApiResponse,
  CategoriaIngrediente,
  CriarCategoriaInput,
  AtualizarCategoriaInput,
} from '@/types/estoque'

export const categoriasService = {
  listar: async (apenasAtivos = true): Promise<CategoriaIngrediente[]> => {
    const resp = await api.get<ApiResponse<CategoriaIngrediente[]>>(
      `/categorias?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaInput): Promise<CategoriaIngrediente> => {
    const resp = await api.post<ApiResponse<CategoriaIngrediente>>('/categorias', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaInput): Promise<CategoriaIngrediente> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaIngrediente>>(`/categorias/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias/${id}`)
  },
}
