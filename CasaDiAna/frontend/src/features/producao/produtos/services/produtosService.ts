import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  Produto,
  ProdutoResumo,
  CriarProdutoInput,
  AtualizarProdutoInput,
  FichaTecnica,
  DefinirFichaTecnicaInput,
} from '@/types/producao'

export const produtosService = {
  listar: async (apenasAtivos = true): Promise<ProdutoResumo[]> => {
    const resp = await api.get<ApiResponse<ProdutoResumo[]>>(
      `/produtos?apenasAtivos=${apenasAtivos}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Produto> => {
    const resp = await api.get<ApiResponse<Produto>>(`/produtos/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarProdutoInput): Promise<Produto> => {
    const resp = await api.post<ApiResponse<Produto>>('/produtos', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarProdutoInput): Promise<Produto> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<Produto>>(`/produtos/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`)
  },

  obterFichaTecnica: async (id: string): Promise<FichaTecnica> => {
    const resp = await api.get<ApiResponse<FichaTecnica>>(`/produtos/${id}/ficha-tecnica`)
    return resp.data.dados
  },

  definirFichaTecnica: async (id: string, input: DefinirFichaTecnicaInput): Promise<FichaTecnica> => {
    const resp = await api.put<ApiResponse<FichaTecnica>>(`/produtos/${id}/ficha-tecnica`, input)
    return resp.data.dados
  },
}
