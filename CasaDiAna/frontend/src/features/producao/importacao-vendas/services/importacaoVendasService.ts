import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type {
  PreviewImportacao,
  ConfirmarImportacaoInput,
  ResultadoImportacao,
} from '@/types/importacao'

export const importacaoVendasService = {
  preview: async (arquivo: File): Promise<PreviewImportacao> => {
    const form = new FormData()
    form.append('arquivo', arquivo)
    const resp = await api.post<ApiResponse<PreviewImportacao>>(
      '/importacao-vendas/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return resp.data.dados!
  },

  confirmar: async (input: ConfirmarImportacaoInput): Promise<ResultadoImportacao> => {
    const resp = await api.post<ApiResponse<ResultadoImportacao>>(
      '/importacao-vendas/confirmar',
      input
    )
    return resp.data.dados!
  },
}
