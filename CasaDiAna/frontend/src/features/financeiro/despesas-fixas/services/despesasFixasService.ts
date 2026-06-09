import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { CategoriaDespesaFixa } from '../../shared/competencia'

export interface DespesaFixa {
  id: string
  competencia: string
  categoria: CategoriaDespesaFixa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
  ativo: boolean
}

export interface TotalCategoria {
  categoria: CategoriaDespesaFixa
  total: number
}

export interface DespesasFixasMes {
  competencia: string
  total: number
  itens: DespesaFixa[]
  totalPorCategoria: TotalCategoria[]
}

export interface DespesaFixaInput {
  competencia: string
  categoria: CategoriaDespesaFixa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
}

export const despesasFixasService = {
  listar: async (competencia: string): Promise<DespesasFixasMes> => {
    const resp = await api.get<ApiResponse<DespesasFixasMes>>(
      `/despesas-fixas?competencia=${competencia}`,
    )
    return resp.data.dados
  },

  criar: async (input: DespesaFixaInput): Promise<DespesaFixa> => {
    const resp = await api.post<ApiResponse<DespesaFixa>>('/despesas-fixas', input)
    return resp.data.dados
  },

  atualizar: async (id: string, input: DespesaFixaInput): Promise<DespesaFixa> => {
    const resp = await api.put<ApiResponse<DespesaFixa>>(`/despesas-fixas/${id}`, input)
    return resp.data.dados
  },

  cancelar: async (id: string): Promise<void> => {
    await api.delete(`/despesas-fixas/${id}`)
  },
}
