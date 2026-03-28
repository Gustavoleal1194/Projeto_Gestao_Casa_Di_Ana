import api from '@/lib/api'
import type {
  ApiResponse,
  EstoqueAtualItem,
  MovimentacaoRelatorio,
  EntradaRelatorioResumo,
  InsumoProducaoDia,
} from '@/types/estoque'
import type { RelatorioProducaoVendas } from '@/types/producao'

export const relatoriosService = {
  estoqueAtual: async (apenasAbaixoDoMinimo = false): Promise<EstoqueAtualItem[]> => {
    const resp = await api.get<ApiResponse<EstoqueAtualItem[]>>(
      `/relatorios/estoque-atual?apenasAbaixoDoMinimo=${apenasAbaixoDoMinimo}`
    )
    return resp.data.dados
  },

  movimentacoes: async (
    de: string,
    ate: string,
    tipo?: string,
    ingredienteId?: string
  ): Promise<MovimentacaoRelatorio[]> => {
    const params = new URLSearchParams({ de, ate })
    if (tipo) params.set('tipo', tipo)
    if (ingredienteId) params.set('ingredienteId', ingredienteId)
    const resp = await api.get<ApiResponse<MovimentacaoRelatorio[]>>(
      `/relatorios/movimentacoes?${params.toString()}`
    )
    return resp.data.dados
  },

  entradas: async (de: string, ate: string): Promise<EntradaRelatorioResumo> => {
    const params = new URLSearchParams({ de, ate })
    const resp = await api.get<ApiResponse<EntradaRelatorioResumo>>(
      `/relatorios/entradas?${params.toString()}`
    )
    return resp.data.dados
  },

  producaoVendas: async (de: string, ate: string, produtoId?: string): Promise<RelatorioProducaoVendas> => {
    const params = new URLSearchParams({ de, ate })
    if (produtoId) params.set('produtoId', produtoId)
    const resp = await api.get<ApiResponse<RelatorioProducaoVendas>>(
      `/relatorios/producao-vendas?${params.toString()}`
    )
    return resp.data.dados
  },

  insumosProducao: async (
    de: string,
    ate: string,
    ingredienteId?: string,
    produtoId?: string
  ): Promise<InsumoProducaoDia[]> => {
    const params = new URLSearchParams({ de, ate })
    if (ingredienteId) params.set('ingredienteId', ingredienteId)
    if (produtoId) params.set('produtoId', produtoId)
    const resp = await api.get<ApiResponse<InsumoProducaoDia[]>>(
      `/relatorios/insumos-producao?${params.toString()}`
    )
    return resp.data.dados
  },
}
