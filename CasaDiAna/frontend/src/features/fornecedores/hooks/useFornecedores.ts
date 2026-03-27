import { useState, useEffect, useCallback } from 'react'
import { fornecedoresService } from '../services/fornecedoresService'
import type { Fornecedor } from '@/types/estoque'

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await fornecedoresService.listar()
      setFornecedores(data)
    } catch {
      setErro('Erro ao carregar fornecedores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const desativar = useCallback(async (id: string) => {
    await fornecedoresService.desativar(id)
    setFornecedores(prev => prev.filter(f => f.id !== id))
  }, [])

  return { fornecedores, loading, erro, recarregar, desativar }
}
