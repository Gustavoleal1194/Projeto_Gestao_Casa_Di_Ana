import { useState, useCallback } from 'react'
import { vendasDiariasService } from '../services/vendasDiariasService'
import type { VendaDiaria } from '@/types/producao'

function primeiroDoMes(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function useVendasDiarias() {
  const [vendas, setVendas] = useState<VendaDiaria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())

  const carregar = useCallback(async (filtroDe?: string, filtroAte?: string, produtoIds?: string[]) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await vendasDiariasService.listar(filtroDe ?? de, filtroAte ?? ate, produtoIds)
      setVendas(data)
    } catch {
      setErro('Erro ao carregar vendas.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  return { vendas, loading, erro, de, ate, setDe, setAte, carregar }
}
