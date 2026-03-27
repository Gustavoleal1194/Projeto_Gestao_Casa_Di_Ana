import api from '@/lib/api'
import type {
  ApiResponse,
  Fornecedor,
  CriarFornecedorInput,
  AtualizarFornecedorInput,
} from '@/types/estoque'

export const fornecedoresService = {
  listar: async (): Promise<Fornecedor[]> => {
    const resp = await api.get<ApiResponse<Fornecedor[]>>('/fornecedores?apenasAtivos=true')
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Fornecedor> => {
    const resp = await api.get<ApiResponse<Fornecedor>>(`/fornecedores/${id}`)
    return resp.data.dados
  },

  criar: async (input: CriarFornecedorInput): Promise<Fornecedor> => {
    const resp = await api.post<ApiResponse<Fornecedor>>('/fornecedores', input)
    return resp.data.dados
  },

  atualizar: async (input: AtualizarFornecedorInput): Promise<Fornecedor> => {
    const { id, ...body } = input
    const resp = await api.put<ApiResponse<Fornecedor>>(`/fornecedores/${id}`, body)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/fornecedores/${id}`)
  },
}
