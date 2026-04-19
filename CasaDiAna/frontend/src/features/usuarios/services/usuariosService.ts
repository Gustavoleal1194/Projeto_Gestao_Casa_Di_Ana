import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

export interface UsuarioDto {
  id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  criadoEm: string
  twoFactorHabilitado: boolean
  telefoneMascarado: string | null
}

export interface CriarUsuarioInput {
  nome: string
  email: string
  senha: string
  papel: string
}

export const usuariosService = {
  listar: async (): Promise<UsuarioDto[]> => {
    const resp = await api.get<ApiResponse<UsuarioDto[]>>('/usuarios')
    return resp.data.dados
  },

  criar: async (input: CriarUsuarioInput): Promise<UsuarioDto> => {
    const resp = await api.post<ApiResponse<UsuarioDto>>('/usuarios', input)
    return resp.data.dados
  },

  desativar: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}`)
  },

  redefinirSenha: async (id: string, novaSenha: string): Promise<void> => {
    await api.patch(`/usuarios/${id}/senha`, { novaSenha })
  },

  habilitar2Fa: async (id: string, telefone: string): Promise<void> => {
    await api.post(`/usuarios/${id}/2fa/habilitar`, { telefone })
  },

  desabilitar2Fa: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}/2fa`)
  },
}
