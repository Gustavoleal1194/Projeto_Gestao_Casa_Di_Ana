import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

export interface MeuPerfilDto {
  nome: string
  email: string
  papel: string
  twoFactorHabilitado: boolean
  ultimoLogin: string | null
  ipUltimoLogin: string | null
  userAgentUltimoLogin: string | null
  totalLogins: number
}

export const minhaContaService = {
  obterMeuPerfil: async (): Promise<MeuPerfilDto> => {
    const resp = await api.get<ApiResponse<MeuPerfilDto>>('/auth/me')
    if (!resp.data.sucesso)
      throw new Error(resp.data.erros?.[0] ?? 'Erro ao carregar perfil.')
    return resp.data.dados
  },
}
