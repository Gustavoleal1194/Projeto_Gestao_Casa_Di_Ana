import { useState, useEffect, useCallback } from 'react'
import { categoriasService } from '../services/categoriasService'
import type { CategoriaIngrediente } from '@/types/estoque'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasService.listar()
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
    await categoriasService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
