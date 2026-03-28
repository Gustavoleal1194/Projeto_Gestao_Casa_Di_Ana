import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { PerdaProduto, RegistrarPerdaInput } from '@/types/producao'

export const perdasService = {
  listar: async (de?: string, ate?: string, produtoId?: string): Promise<PerdaProduto[]> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    if (produtoId) params.set('produtoId', produtoId)
    const resp = await api.get<ApiResponse<PerdaProduto[]>>(`/perdas?${params.toString()}`)
    return resp.data.dados
  },

  registrar: async (input: RegistrarPerdaInput): Promise<PerdaProduto> => {
    const resp = await api.post<ApiResponse<PerdaProduto>>('/perdas', input)
    return resp.data.dados
  },
}
