import { useState, useEffect, useCallback } from 'react'
import { utensiliosService } from '../services/utensiliosService'
import type { UtensilioResumo } from '@/types/estoque'

interface UseUtensiliosOptions {
  apenasAtivos?: boolean
}

export function useUtensilios({ apenasAtivos = true }: UseUtensiliosOptions = {}) {
  const [utensilios, setUtensilios] = useState<UtensilioResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const dados = await utensiliosService.listar(apenasAtivos)
      setUtensilios(dados)
    } catch {
      setErro('Não foi possível carregar os utensílios.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    carregar()
  }, [carregar])

  const desativar = useCallback(async (id: string) => {
    await utensiliosService.desativar(id)
    await carregar()
  }, [carregar])

  return { utensilios, loading, erro, recarregar: carregar, desativar }
}
