import axios from 'axios'
import type { ApiResponse } from '@/types/estoque'

interface LoginInput {
  email: string
  senha: string
}

interface TokenDto {
  token: string
  nome: string
  papel: string
}

// Chamada direta — sem interceptor, usuário ainda não tem token
export const authService = {
  login: async (input: LoginInput): Promise<TokenDto> => {
    try {
      const resp = await axios.post<ApiResponse<TokenDto>>(
        'http://localhost:5130/api/auth/login',
        input
      )
      if (!resp.data.sucesso) {
        throw new Error(resp.data.erros?.[0] ?? 'Credenciais inválidas.')
      }
      return resp.data.dados
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: ApiResponse<TokenDto> } }
      if (err?.response?.status === 401) {
        const erros = err.response.data?.erros
        throw new Error(erros?.[0] ?? 'E-mail ou senha incorretos.')
      }
      throw e
    }
  },
}
