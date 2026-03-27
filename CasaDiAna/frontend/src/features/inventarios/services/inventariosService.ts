import api from '@/lib/api'
import type {
  ApiResponse,
  Inventario,
  InventarioResumo,
  IniciarInventarioInput,
  AdicionarItemInventarioInput,
} from '@/types/estoque'

export const inventariosService = {
  listar: async (): Promise<InventarioResumo[]> => {
    const resp = await api.get<ApiResponse<InventarioResumo[]>>('/inventarios')
    return resp.data.dados
  },

  obterPorId: async (id: string): Promise<Inventario> => {
    const resp = await api.get<ApiResponse<Inventario>>(`/inventarios/${id}`)
    return resp.data.dados
  },

  iniciar: async (input: IniciarInventarioInput): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>('/inventarios', input)
    return resp.data.dados
  },

  adicionarItem: async (
    inventarioId: string,
    input: AdicionarItemInventarioInput
  ): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(
      `/inventarios/${inventarioId}/itens`,
      input
    )
    return resp.data.dados
  },

  finalizar: async (id: string): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(`/inventarios/${id}/finalizar`)
    return resp.data.dados
  },

  cancelar: async (id: string): Promise<Inventario> => {
    const resp = await api.post<ApiResponse<Inventario>>(`/inventarios/${id}/cancelar`)
    return resp.data.dados
  },
}
