import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export interface UsuarioLogado {
  nome: string
  papel: string
}

interface AuthStore {
  token: string | null
  usuario: UsuarioLogado | null
  /** quando false, a sessão fica em sessionStorage (some ao fechar o navegador) */
  manter: boolean
  login: (token: string, usuario: UsuarioLogado, manter?: boolean) => void
  logout: () => void
  estaAutenticado: () => boolean
  temPapel: (...papeis: string[]) => boolean
}

const STORAGE_KEY = 'casa-di-ana-auth'

/**
 * Persiste em localStorage quando `state.manter` é true; senão em sessionStorage.
 * Sempre remove a chave do storage oposto para evitar sessões duplicadas.
 */
const storage: StateStorage = {
  getItem: name => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    let manter = true
    try {
      manter = JSON.parse(value)?.state?.manter ?? true
    } catch {
      manter = true
    }
    if (manter) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },
  removeItem: name => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      manter: true,

      login: (token, usuario, manter = true) => set({ token, usuario, manter }),

      logout: () => set({ token: null, usuario: null, manter: true }),

      estaAutenticado: () => {
        const token = get().token
        if (!token) return false
        try {
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
    { name: STORAGE_KEY, storage: createJSONStorage(() => storage) },
  ),
)
