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

  existeNaData: async (dataVenda: string): Promise<boolean> => {
    const resp = await api.get<ApiResponse<boolean>>('/importacao-vendas/existe-na-data', {
      params: { data: dataVenda },
    })
    return resp.data.dados ?? false
  },

  confirmar: async (input: ConfirmarImportacaoInput): Promise<ResultadoImportacao> => {
    const form = new FormData()
    form.append('arquivo', input.arquivo)
    form.append('dataVenda', input.dataVenda)
    input.vinculos.forEach((v, i) => {
      form.append(`vinculos[${i}].nomeRelatorio`, v.nomeRelatorio)
      form.append(`vinculos[${i}].produtoId`, v.produtoId)
    })
    input.linhasRemovidas.forEach((nome, i) => form.append(`linhasRemovidas[${i}]`, nome))
    form.append('permitirDataJaImportada', String(input.permitirDataJaImportada))
    const resp = await api.post<ApiResponse<ResultadoImportacao>>(
      '/importacao-vendas/confirmar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return resp.data.dados!
  },
}
