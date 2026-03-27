import { useState, useEffect, useCallback } from 'react'
import { inventariosService } from '../services/inventariosService'
import type { InventarioResumo } from '@/types/estoque'

export function useInventarios() {
  const [inventarios, setInventarios] = useState<InventarioResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await inventariosService.listar()
      setInventarios(data)
    } catch {
      setErro('Erro ao carregar inventários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { inventarios, loading, erro, recarregar }
}
