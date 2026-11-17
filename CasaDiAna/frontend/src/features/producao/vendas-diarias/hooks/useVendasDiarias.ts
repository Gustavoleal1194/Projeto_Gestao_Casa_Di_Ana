import { useState, useCallback } from 'react'
import { vendasDiariasService } from '../services/vendasDiariasService'
import type { VendaDiaria } from '@/types/producao'
import { hojeIso, inicioDoMesIso } from '@/lib/datas'

export function useVendasDiarias() {
  const [vendas, setVendas] = useState<VendaDiaria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(inicioDoMesIso())
  const [ate, setAte] = useState(hojeIso())

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
