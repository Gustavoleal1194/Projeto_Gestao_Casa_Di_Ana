import { create } from 'zustand'

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

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  usuario: null,

  login: (token, usuario) => set({ token, usuario }),

  logout: () => set({ token: null, usuario: null }),

  estaAutenticado: () => get().token !== null,

  temPapel: (...papeis) => {
    const papel = get().usuario?.papel
    return papel ? papeis.includes(papel) : false
  },
}))
