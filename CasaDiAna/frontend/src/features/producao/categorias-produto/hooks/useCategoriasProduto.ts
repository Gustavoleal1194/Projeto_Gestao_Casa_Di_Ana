import { useState, useEffect, useCallback } from 'react'
import { categoriasProdutoService } from '../services/categoriasProdutoService'
import type { CategoriaProduto } from '@/types/producao'

export function useCategoriasProduto() {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await categoriasProdutoService.listar()
      setCategorias(data)
    } catch {
      setErro('Erro ao carregar categorias de produto.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await categoriasProdutoService.desativar(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categorias, loading, erro, recarregar, desativar }
}
