import api from '@/lib/api'
import type {
  ApiResponse,
  EstoqueAtualItem,
  MovimentacaoRelatorio,
  EntradaRelatorioResumo,
  InsumoProducaoDia,
  ComparacaoPreco,
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

  producaoVendas: async (de: string, ate: string, produtoIds?: string[]): Promise<RelatorioProducaoVendas> => {
    const params = new URLSearchParams({ de, ate })
    produtoIds?.forEach(id => params.append('produtoIds', id))
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

  comparacaoPrecos: async (
    de?: string,
    ate?: string,
    ingredienteId?: string
  ): Promise<ComparacaoPreco> => {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    if (ingredienteId) params.set('ingredienteId', ingredienteId)
    const qs = params.toString()
    const resp = await api.get<ApiResponse<ComparacaoPreco>>(
      `/relatorios/comparacao-precos${qs ? `?${qs}` : ''}`
    )
    return resp.data.dados
  },
}
