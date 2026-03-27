import api from '@/lib/api'
import type {
  ApiResponse,
  EntradaMercadoria,
  EntradaMercadoriaResumo,
  RegistrarEntradaInput,
} from '@/types/estoque'

export const entradasService = {
  listar: async (de?: string, ate?: string): Promise<EntradaMercadoriaResumo[]> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    const resp = await api.get<ApiResponse<EntradaMercadoriaResumo[]>>(
      `/entradas?${params.toString()}`
    )
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<EntradaMercadoria> => {
    const resp = await api.get<ApiResponse<EntradaMercadoria>>(`/entradas/${id}`)
    return resp.data.dados
  },

  registrar: async (input: RegistrarEntradaInput): Promise<EntradaMercadoria> => {
    const resp = await api.post<ApiResponse<EntradaMercadoria>>('/entradas', input)
    return resp.data.dados
  },

  cancelar: async (id: string): Promise<EntradaMercadoria> => {
    const resp = await api.post<ApiResponse<EntradaMercadoria>>(`/entradas/${id}/cancelar`)
    return resp.data.dados
  },
}
