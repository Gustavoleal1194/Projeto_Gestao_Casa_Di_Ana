import { useState, useCallback } from 'react'
import { producaoDiariaService } from '../services/producaoDiariaService'
import type { ProducaoDiaria } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function useProducaoDiaria() {
  const [producoes, setProducoes] = useState<ProducaoDiaria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const carregar = useCallback(async (filtroDe?: string, filtroAte?: string, produtoId?: string) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await producaoDiariaService.listar(filtroDe ?? de, filtroAte ?? ate, produtoId)
      setProducoes(data)
    } catch {
      setErro('Erro ao carregar produções.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  return { producoes, loading, erro, de, ate, setDe, setAte, carregar }
}
