import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  CategoriaProduto,
  CriarCategoriaProdutoInput,
  AtualizarCategoriaProdutoInput,
} from '@/types/producao'

export const categoriasProdutoService = {
  listar: async (apenasAtivos = true): Promise<CategoriaProduto[]> => {
    const resp = await api.get<ApiResponse<CategoriaProduto[]>>(
      `/categorias-produto?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  criar: async (input: CriarCategoriaProdutoInput): Promise<CategoriaProduto> => {
    const resp = await api.post<ApiResponse<CategoriaProduto>>('/categorias-produto', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarCategoriaProdutoInput): Promise<CategoriaProduto> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<CategoriaProduto>>(`/categorias-produto/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/categorias-produto/${id}`)
  },
}
