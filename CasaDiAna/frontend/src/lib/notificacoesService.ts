import api from './api'

export interface NotificacaoEstoqueDto {
  id: string
  titulo: string
  mensagem: string
  tipo: 'Atencao' | 'Critico' | 'Zerado'
  dataCriacao: string
  lida: boolean
  ingredienteId: string
  ingredienteNome?: string
}

interface ApiResponse<T> {
  sucesso: boolean
  dados: T
  erros: string[]
}

export const notificacoesService = {
  async listar(apenasNaoLidas = false): Promise<NotificacaoEstoqueDto[]> {
    const { data } = await api.get<ApiResponse<NotificacaoEstoqueDto[]>>(
      `/notificacoes?apenasNaoLidas=${apenasNaoLidas}`
    )
    return data.dados ?? []
  },

  async contarNaoLidas(): Promise<number> {
    const { data } = await api.get<ApiResponse<number>>('/notificacoes/contagem')
    return data.dados ?? 0
  },

  async marcarLida(id: string): Promise<void> {
    await api.patch(`/notificacoes/${id}/lida`)
  },

  async marcarTodasLidas(): Promise<void> {
    await api.patch('/notificacoes/marcar-todas-lidas')
  },
}
