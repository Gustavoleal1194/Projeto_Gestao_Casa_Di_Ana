import { useState, useEffect, useCallback } from 'react'
import { ingredientesService } from '../services/ingredientesService'
import type { IngredienteResumo } from '@/types/estoque'

interface UseIngredientesOptions {
  apenasAtivos?: boolean
}

export function useIngredientes({ apenasAtivos = true }: UseIngredientesOptions = {}) {
  const [ingredientes, setIngredientes] = useState<IngredienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const dados = await ingredientesService.listar(apenasAtivos)
      setIngredientes(dados)
    } catch {
      setErro('Não foi possível carregar os ingredientes.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    carregar()
  }, [carregar])

  const desativar = useCallback(async (id: string) => {
    await ingredientesService.desativar(id)
    await carregar()
  }, [carregar])

  return { ingredientes, loading, erro, recarregar: carregar, desativar }
}
