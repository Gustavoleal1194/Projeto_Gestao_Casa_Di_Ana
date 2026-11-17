import { useState, useCallback } from 'react'
import { entradasService } from '../services/entradasService'
import type { EntradaMercadoriaResumo } from '@/types/estoque'
import { hojeIso, inicioDoMesIso } from '@/lib/datas'

export function useEntradas() {
  const [entradas, setEntradas] = useState<EntradaMercadoriaResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [de, setDe] = useState(inicioDoMesIso)
  const [ate, setAte] = useState(hojeIso)

  const carregar = useCallback(async (filtroDE?: string, filtroATE?: string) => {
    const deFinal = filtroDE ?? de
    const ateFinal = filtroATE ?? ate
    setLoading(true)
    setErro(null)
    try {
      const data = await entradasService.listar(deFinal, ateFinal)
      setEntradas(data)
    } catch {
      setErro('Erro ao carregar entradas.')
    } finally {
      setLoading(false)
    }
  }, [de, ate])

  const atualizarDe = (valor: string) => setDe(valor)
  const atualizarAte = (valor: string) => setAte(valor)

  return { entradas, loading, erro, de, ate, atualizarDe, atualizarAte, carregar }
}
