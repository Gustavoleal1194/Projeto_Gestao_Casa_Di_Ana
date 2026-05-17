import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UsuarioLogado {
  nome: string
  papel: string
}

interface AuthStore {
  token: string | null
  usuario: UsuarioLogado | null
  login: (token: string, usuario: UsuarioLogado) => void
  logout: () => void
  estaAutenticado: () => boolean
  temPapel: (...papeis: string[]) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,

      login: (token, usuario) => set({ token, usuario }),

      logout: () => set({ token: null, usuario: null }),

      estaAutenticado: () => {
        const token = get().token
        if (!token) return false
        try {
          // JWT usa base64url — converter para base64 padrão antes do atob
          const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
          const { exp } = JSON.parse(atob(b64))
          return exp * 1000 > Date.now()
        } catch {
          return false
        }
      },

      temPapel: (...papeis) => {
        const papel = get().usuario?.papel
        return papel ? papeis.includes(papel) : false
      },
    }),
    { name: 'casa-di-ana-auth' }
  )
)
