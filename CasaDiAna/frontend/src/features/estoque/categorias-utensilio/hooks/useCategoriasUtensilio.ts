import { useState, useEffect, useCallback } from 'react'
import { categoriasUtensilioService } from '../services/categoriasUtensilioService'
import type { CategoriaUtensilio } from '@/types/estoque'

export function useCategoriasUtensilio() {
  const [categorias, setCategorias] = useState<CategoriaUtensilio[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasUtensilioService.listar()
      setCategorias(data)
    } catch {
      setErro('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await categoriasUtensilioService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
