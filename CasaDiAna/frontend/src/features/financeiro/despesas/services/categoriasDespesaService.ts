import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { TipoDespesa } from '../../shared/competencia'

export interface CategoriaDespesa {
  id: string
  nome: string
  tipo: TipoDespesa
  ehFolhaPagamento: boolean
  ativo: boolean
}

export interface CategoriaDespesaInput {
  nome: string
  tipo: TipoDespesa
  ehFolhaPagamento: boolean
}

export const categoriasDespesaService = {
  listar: async (tipo?: TipoDespesa, apenasAtivas = true): Promise<CategoriaDespesa[]> => {
    const t = tipo ? `&tipo=${tipo}` : ''
    const resp = await api.get<ApiResponse<CategoriaDespesa[]>>(`/categorias-despesa?apenasAtivas=${apenasAtivas}${t}`)
    return resp.data.dados
  },
  criar: async (input: CategoriaDespesaInput): Promise<CategoriaDespesa> => {
    const resp = await api.post<ApiResponse<CategoriaDespesa>>('/categorias-despesa', input)
    return resp.data.dados
  },
  atualizar: async (id: string, input: CategoriaDespesaInput): Promise<CategoriaDespesa> => {
    const resp = await api.put<ApiResponse<CategoriaDespesa>>(`/categorias-despesa/${id}`, input)
    return resp.data.dados
  },
  desativar: async (id: string): Promise<void> => { await api.delete(`/categorias-despesa/${id}`) },
}
