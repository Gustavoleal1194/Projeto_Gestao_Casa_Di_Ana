import api from '@/lib/api'
import type { ApiResponse, CategoriaIngrediente } from '@/types/estoque'

export const categoriasService = {
  listar: async (): Promise<CategoriaIngrediente[]> => {
    const resp = await api.get<ApiResponse<CategoriaIngrediente[]>>('/categorias?apenasAtivos=true')
    return resp.data.dados
  },
}
