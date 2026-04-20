// frontend/src/features/auth/services/authService.ts
import api from '@/lib/api'
import type { ApiResponse } from '@/types/estoque'

interface LoginInput {
  email: string
  senha: string
}

export interface LoginResultDto {
  requer2Fa: boolean
  tokenTemporario: string | null
  token: string | null
  nome: string | null
  papel: string | null
}

interface TokenDto {
  token: string
  nome: string
  papel: string
}

export interface IniciarSetup2FaResultDto {
  qrCodeUrl: string
  secretManual: string
  codigosRecuperacao: string[]
}

export const authService = {
  login: async (input: LoginInput): Promise<LoginResultDto> => {
    try {
      const resp = await api.post<ApiResponse<LoginResultDto>>('/auth/login', input)
      if (!resp.data.sucesso) {
        throw new Error(resp.data.erros?.[0] ?? 'Credenciais inválidas.')
      }
      return resp.data.dados
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: ApiResponse<LoginResultDto> } }
      if (err?.response?.status === 401) {
        const erros = err.response?.data?.erros
        throw new Error(erros?.[0] ?? 'E-mail ou senha incorretos.')
      }
      throw e
    }
  },

  verificarOtp: async (codigo: string, tokenTemporario: string): Promise<TokenDto> => {
    try {
      const resp = await api.post<ApiResponse<TokenDto>>(
        '/auth/verificar-2fa',
        { codigo },
        { headers: { Authorization: `Bearer ${tokenTemporario}` } }
      )
      if (!resp.data.sucesso) {
        throw new Error(resp.data.erros?.[0] ?? 'Código inválido.')
      }
      return resp.data.dados
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: ApiResponse<TokenDto> } }
      if (err?.response?.status === 401 || err?.response?.status === 422) {
        const erros = err.response?.data?.erros
        throw new Error(erros?.[0] ?? 'Código inválido ou expirado.')
      }
      throw e
    }
  },

  iniciarSetup2Fa: async (): Promise<IniciarSetup2FaResultDto> => {
    const resp = await api.post<ApiResponse<IniciarSetup2FaResultDto>>('/auth/iniciar-setup-2fa')
    if (!resp.data.sucesso) throw new Error(resp.data.erros?.[0] ?? 'Erro ao iniciar setup.')
    return resp.data.dados
  },

  confirmarSetup2Fa: async (
    secret: string,
    codigo: string,
    codigosRecuperacao: string[]
  ): Promise<void> => {
    const resp = await api.post<ApiResponse<null>>('/auth/confirmar-setup-2fa', {
      secret,
      codigo,
      codigosRecuperacao,
    })
    if (!resp.data.sucesso) throw new Error(resp.data.erros?.[0] ?? 'Código inválido.')
  },
}
