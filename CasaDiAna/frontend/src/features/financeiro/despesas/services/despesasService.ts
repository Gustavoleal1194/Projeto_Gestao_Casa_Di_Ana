import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'
import type { TipoDespesa } from '../../shared/competencia'

export interface Despesa {
  id: string
  competencia: string
  categoriaDespesaId: string
  categoriaNome: string
  tipo: TipoDespesa
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
  ativo: boolean
}

export interface TotalCategoria { categoriaId: string; categoriaNome: string; total: number }

export interface DespesasMes {
  competencia: string
  totalFixas: number
  totalVariaveis: number
  itens: Despesa[]
  totalPorCategoria: TotalCategoria[]
}

export interface DespesaInput {
  competencia: string
  categoriaDespesaId: string
  descricao: string | null
  valor: number
  observacao: string | null
  dataLancamento: string
}

export interface CompraNota {
  entradaId: string
  fornecedor: string
  numeroNotaFiscal: string | null
  data: string
  total: number
}

export interface ComprasMes { competencia: string; totalCompras: number; itens: CompraNota[] }

export const despesasService = {
  listar: async (competencia: string, tipo?: TipoDespesa): Promise<DespesasMes> => {
    const q = tipo ? `&tipo=${tipo}` : ''
    const resp = await api.get<ApiResponse<DespesasMes>>(`/despesas?competencia=${competencia}${q}`)
    return resp.data.dados
  },
  criar: async (input: DespesaInput): Promise<Despesa> => {
    const resp = await api.post<ApiResponse<Despesa>>('/despesas', input)
    return resp.data.dados
  },
  atualizar: async (id: string, input: DespesaInput): Promise<Despesa> => {
    const resp = await api.put<ApiResponse<Despesa>>(`/despesas/${id}`, input)
    return resp.data.dados
  },
  cancelar: async (id: string): Promise<void> => { await api.delete(`/despesas/${id}`) },
  compras: async (competencia: string): Promise<ComprasMes> => {
    const resp = await api.get<ApiResponse<ComprasMes>>(`/despesas/compras?competencia=${competencia}`)
    return resp.data.dados
  },
}
