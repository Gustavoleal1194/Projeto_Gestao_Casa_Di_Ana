import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { ProducaoDiaria, RegistrarProducaoInput } from '@/types/producao'

export const producaoDiariaService = {
  listar: async (de?: string, ate?: string, produtoId?: string): Promise<ProducaoDiaria[]> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    if (produtoId) params.set('produtoId', produtoId)
    const query = params.toString()
    const resp = await api.get<ApiResponse<ProducaoDiaria[]>>(
      `/producao-diaria${query ? `?${query}` : ''}`
    )
    return resp.data.dados
  },

  registrar: async (input: RegistrarProducaoInput): Promise<ProducaoDiaria> => {
    const resp = await api.post<ApiResponse<ProducaoDiaria>>('/producao-diaria', input)
    return resp.data.dados
  },
}
