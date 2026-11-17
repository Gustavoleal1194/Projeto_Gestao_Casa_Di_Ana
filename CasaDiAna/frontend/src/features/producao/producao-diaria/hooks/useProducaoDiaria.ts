import { useState, useCallback } from 'react'
import { producaoDiariaService } from '../services/producaoDiariaService'
import type { ProducaoDiaria } from '@/types/producao'
import { hojeIso, inicioDoMesIso } from '@/lib/datas'

export function useProducaoDiaria() {
  const [producoes, setProducoes] = useState<ProducaoDiaria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(inicioDoMesIso())
  const [ate, setAte] = useState(hojeIso())

  const carregar = useCallback(async (filtroDe?: string, filtroAte?: string, produtoIds?: string[]) => {
    setLoading(true)
    setErro(null)
    try {
      const data = await producaoDiariaService.listar(filtroDe ?? de, filtroAte ?? ate, produtoIds)
      setProducoes(data)
    } catch {
      setErro('Erro ao carregar produções.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  return { producoes, loading, erro, de, ate, setDe, setAte, carregar }
}
