import { useState, useEffect, useCallback } from 'react'
import { produtosService } from '../services/produtosService'
import type { ProdutoResumo } from '@/types/producao'

export function useProdutos(apenasAtivos = true) {
  const [produtos, setProdutos] = useState<ProdutoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await produtosService.listar(apenasAtivos)
      setProdutos(data)
    } catch {
      setErro('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }, [apenasAtivos])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await produtosService.desativar(id)
    setProdutos(prev => prev.filter(p => p.id !== id))
  }, [])

  return { produtos, loading, erro, recarregar, desativar }
}
