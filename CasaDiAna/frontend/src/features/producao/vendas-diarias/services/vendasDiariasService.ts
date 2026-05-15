import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { VendaDiaria, RegistrarVendaInput } from '@/types/producao'

export const vendasDiariasService = {
  listar: async (de?: string, ate?: string, produtoIds?: string[]): Promise<VendaDiaria[]> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    produtoIds?.forEach(id => params.append('produtoIds', id))
    const query = params.toString()
    const resp = await api.get<ApiResponse<VendaDiaria[]>>(
      `/vendas-diarias${query ? `?${query}` : ''}`
    )
    return resp.data.dados
  },

  registrar: async (input: RegistrarVendaInput): Promise<VendaDiaria> => {
    const resp = await api.post<ApiResponse<VendaDiaria>>('/vendas-diarias', input)
    return resp.data.dados
  },
}
